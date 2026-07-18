import { Game } from "../core/game.js";
import { renderBoard } from "../core/renderer.js";
import { fetchLevel } from "../levels/levelLoader.js";
import { markCompleted } from "../levels/levelProgress.js";
import { saveLevelRecord, saveLevelTimeRecord } from "../levels/levelRecords.js";
import { LevelTimer, LevelCountdown, formatTime, LEVEL_REMAINING_MOVES_INITIAL } from "../core/levelTimer.js";
import { showWinScreen } from "./winScreen.js";
import { showImpeachmentScreen } from "./impeachmentScreen.js";
import { calcMood } from "../socionics/mood.js";
import { stopBoardLayoutListener, refitBoard } from "../core/boardLayout.js";
import { mountFloatingAudioControls } from "../ui/floatingAudioControls.js";
import { audioManager } from "../core/audioManager.js";
import NavigationService from "../core/navigation.js";

function isCompactUI() {
  return window.matchMedia("(max-width: 768px)").matches;
}

export async function showGameScreen(root, levelId) {
  let level;
  try {
    level = await fetchLevel(levelId);
  } catch (e) {
    alert(e.message);
    return;
  }

  const game = new Game(level);
  root.innerHTML = "";
  root.className = "game-screen";

  const hud = document.createElement("div");
  hud.className = "game-hud";
  const audioControls = mountFloatingAudioControls(hud);

  const timer = new LevelTimer();
  const countdown = new LevelCountdown();
  let elapsedMs = 0;
  let remainingMs = countdown.remainingMs;
  let timerStarted = false;
  let resizeListener = null;
  let lastSecondBeeped = Infinity; // Для отслеживания однократных пиков
  let beeped30 = false;
  let beeped20 = false;

  // --- Resource tracking & cleanup ---
  let levelActive = true;
  const trackedTimeouts = [];
  let cleanedUp = false;

  function trackedSetTimeout(fn, delay) {
    const id = setTimeout(() => {
      const idx = trackedTimeouts.indexOf(id);
      if (idx !== -1) trackedTimeouts.splice(idx, 1);
      if (levelActive) fn();
    }, delay);
    trackedTimeouts.push(id);
    return id;
  }

  function cleanupLevel() {
    if (cleanedUp) return;
    cleanedUp = true;
    levelActive = false;
    timer.destroy();
    countdown.destroy();
    stopBoardLayoutListener();
    audioControls.destroy();
    audioManager.stopWarningBeeps();
    trackedTimeouts.forEach(id => clearTimeout(id));
    trackedTimeouts.length = 0;
    if (resizeListener) {
      window.removeEventListener("resize", resizeListener);
      resizeListener = null;
    }
  }

  // Register cleanup so NavigationService calls it on ANY screen exit
  // (back button, goBack, backTo, goHome, navigate)
  NavigationService.setOnLeave(cleanupLevel);

  function startTimer() {
    if (timerStarted) return;
    timerStarted = true;
    timer.start((ms) => {
      if (!levelActive) return;
      elapsedMs = ms;
    });
    countdown.start(
      (ms) => {
        if (!levelActive) return;
        remainingMs = ms;
        updateStats();
      },
      () => {
        if (!levelActive) return;
        remainingMs = 0;
        checkDefeat();
      }
    );
  }

  function leaveLevel(navigate) {
    cleanupLevel();
    navigate();
  }

  const bar = document.createElement("div");
  bar.className = "topbar";

  const title = document.createElement("span");
  title.className = "topbar-title";
  title.textContent = level.name || ("Уровень " + level.id);

  const buttonsWrapper = document.createElement("div");
  buttonsWrapper.className = "topbar-buttons";

  const navButtons = document.createElement("div");
  navButtons.className = "topbar-nav-buttons";

  const prevBtn = document.createElement("button");
  prevBtn.className = "topbar-prev";
  prevBtn.textContent = isCompactUI() ? "←" : "← Предыдущий";
  prevBtn.disabled = levelId <= 1;
  prevBtn.addEventListener("click", () => {
    audioManager.initAudioContext();
    audioManager.playSoundEffect("assets/sounds/click.mp3");
    leaveLevel(() => NavigationService.navigate("game", () => showGameScreen(root, levelId - 1), { replace: true }));
  });

  const nextBtn = document.createElement("button");
  nextBtn.className = "topbar-next";
  nextBtn.textContent = isCompactUI() ? "→" : "Следующий →";
  nextBtn.disabled = levelId >= 100;
  nextBtn.addEventListener("click", () => {
    audioManager.initAudioContext();
    audioManager.playSoundEffect("assets/sounds/click.mp3");
    leaveLevel(() => NavigationService.navigate("game", () => showGameScreen(root, levelId + 1), { replace: true }));
  });

  const leave = document.createElement("button");
  leave.className = "topbar-leave";
  leave.textContent = isCompactUI() ? "Меню" : "Покинуть уровень";
  leave.addEventListener("click", () => {
    audioManager.initAudioContext();
    audioManager.playSoundEffect("assets/sounds/click.mp3");
    leaveLevel(() => NavigationService.backTo("levelSelect"));
  });

  if (isCompactUI()) {
    // Mobile/tablet layout - original order
    navButtons.appendChild(prevBtn);
    navButtons.appendChild(nextBtn);
    buttonsWrapper.appendChild(navButtons);
    buttonsWrapper.appendChild(leave);

    bar.appendChild(title);
    bar.appendChild(buttonsWrapper);
  } else {
    // Desktop layout - new order: prev, title, next, leave
    bar.appendChild(prevBtn);
    bar.appendChild(title);
    bar.appendChild(nextBtn);
    bar.appendChild(leave);
  }
  root.appendChild(bar);

  const stage = document.createElement("div");
  stage.className = "game-stage";
  stage.style.position = "relative";

  const boardArea = document.createElement("div");
  boardArea.className = "board-area";
  const boardWrap = document.createElement("div");
  boardWrap.className = "board-scroll-wrap";
  const boardEl = document.createElement("div");
  boardEl.id = "board";
  boardWrap.appendChild(boardEl);
  boardArea.appendChild(boardWrap);

  const stats = document.createElement("div");
  stats.id = "stats";
  stats.className = "stats";
  stats.style.position = "absolute";

  stage.appendChild(boardArea);
  stage.appendChild(stats);
  root.appendChild(stage);

  function positionStats() {
    try {
      const compact = isCompactUI();
      if (compact) {
        stats.style.position = "";
        stats.style.left = "";
        stats.style.top = "";
        stats.style.right = "";
        stats.style.transform = "";
      } else {
        stats.style.position = "absolute";
        const stageRect = stage.getBoundingClientRect();
        const boardRect = boardWrap.getBoundingClientRect();
        const left = Math.round(boardRect.right - stageRect.left + 12);
        const centerY = boardRect.top - stageRect.top + boardRect.height / 2;
        stats.style.left = left + "px";
        stats.style.top = centerY + "px";
        stats.style.transform = "translateY(-50%)";
        stats.style.right = "";
      }
    } catch (e) {
      // ignore
    }
  }

  resizeListener = () => {
    refitBoard();
    positionStats();
  };
  window.addEventListener("resize", resizeListener);

  const msg = document.createElement("div");
  msg.id = "message";
  hud.appendChild(msg);
  root.appendChild(hud);

  let won = false;
  let impeached = false;
  let remainingMoves = LEVEL_REMAINING_MOVES_INITIAL;
  let maxHappyCats = 0;
  let maxHappyInitialized = false;

  function handleImpeachment() {
    if (won || impeached) return;
    impeached = true;
    timer.stop();
    countdown.stop();
    audioManager.playLoseSound();
    audioManager.stopWarningBeeps();
    msg.textContent = "";
    showImpeachmentScreen(root, {
      onRetry: () => {
        leaveLevel(() => showGameScreen(root, levelId));
      },
      onMenu: () => {
        leaveLevel(() => NavigationService.backTo("levelSelect"));
      }
    });
    updateStats();
  }

  function checkDefeat() {
    if (won || impeached) return;
    if (remainingMs <= 0) {
      handleImpeachment();
    } else if (remainingMoves <= 0) {
      handleImpeachment();
    }
  }

  function onCell(r, c) {
    if (impeached || won) return;
    if (remainingMs <= 0 || remainingMoves <= 0) {
      checkDefeat();
      return;
    }
    audioManager.initAudioContext();
    const result = game.clickCell(r, c);
    if (result.needRedraw) {
      if (result.moved) {
        remainingMoves--;
        audioManager.playSoundEffect("assets/sounds/move.mp3");
        // Если ходов мало — тихий пик в другой (низкой) тональности
        if (remainingMoves <= 20) {
          audioManager.playBeep(440, 0.08, 0.08);
        }
      }
      void draw();
    }
  }

  function updateStats() {
    const cats = game.board.allCats();
    let happy = 0;
    let unhappy = 0;
    for (const cat of cats) {
      const mood = calcMood(game.board, cat.r, cat.c);
      if (mood >= 1) {
        happy++;
      } else {
        unhappy++;
      }
    }

    if (!maxHappyInitialized) {
      maxHappyCats = happy;
      maxHappyInitialized = true;
    } else if (happy > maxHappyCats) {
      const increase = happy - maxHappyCats; // на сколько вырос максимум
      countdown.addTime(10_000);
      remainingMs = countdown.remainingMs;
      remainingMoves += 5;
      maxHappyCats = happy;
      // "Дзинь!" за каждое увеличение максимума на 1
      for (let i = 0; i < increase; i++) {
        trackedSetTimeout(() => audioManager.playDing(), i * 150);
      }
    }

    // Работа с однократными пиками на 30 и 20 секунд
    const secondsLeft = Math.ceil(remainingMs / 1000);
    if (secondsLeft !== lastSecondBeeped) {
      lastSecondBeeped = secondsLeft;

      if (secondsLeft === 30 && !beeped30) {
        audioManager.playBeep(1100, 0.2);
        beeped30 = true;
      }
      if (secondsLeft === 20 && !beeped20) {
        audioManager.playBeep(1200, 0.2);
        beeped20 = true;
      }
    }

    // Проверка на добавление времени (если добавили >30 секунд, сбрасываем beeped30)
    if (secondsLeft > 30) {
      beeped30 = false;
    }
    if (secondsLeft > 20) {
      beeped20 = false;
    }

    audioManager.updateWarningSound(remainingMs);
    const movesMade = game.getMoveCount();
    const compact = isCompactUI();
    const isTimerCritical = secondsLeft <= 30;
    const timerColor = isTimerCritical ? "color: #ff3333; font-weight: bold;" : "";
    // Красным число оставшихся ходов и слово "осталось", когда их меньше 20
    const movesColor = remainingMoves < 20 ? "color: #ff3333; font-weight: bold;" : "";
    const remainingMovesHtml = `<span style="${movesColor}">${remainingMoves}</span>`;
    stats.innerHTML = compact ? `
      <div class="container-fluid px-0">
        <div class="row g-2 text-end justify-content-end">
          <div class="col-6 col-sm-4 col-md-3 col-lg-2"><div class="stat-item" style="${timerColor}">⏱️ Время: осталось ${formatTime(remainingMs)}</div></div>
          <div class="col-6 col-sm-4 col-md-3 col-lg-2"><div class="stat-item">😊 Довольные: ${happy}</div></div>
          <div class="col-6 col-sm-4 col-md-3 col-lg-2"><div class="stat-item">⏰ На уровне: ${formatTime(elapsedMs)}</div></div>
          <div class="col-6 col-sm-4 col-md-3 col-lg-2"><div class="stat-item">😾 Недовольные: ${unhappy}</div></div>
          <div class="col-6 col-sm-4 col-md-3 col-lg-2"><div class="stat-item">🎯 Ходы: ${remainingMovesHtml}|${movesMade}</div></div>
          <div class="col-6 col-sm-4 col-md-3 col-lg-2"><div class="stat-item">⭐ Макс. довольных: ${maxHappyCats}</div></div>
        </div>
      </div>
    ` : `
      <div class="stat-item">🎯 Ходы: <span style="${movesColor}">осталось</span> | сделано (${remainingMovesHtml}/${movesMade})</div>
      <div class="stat-item" style="${timerColor}">⏱️ Время: осталось ${formatTime(remainingMs)}</div>
      <div class="stat-item">⏰ На уровне: ${formatTime(elapsedMs)}</div>
      <div class="stat-item">😊 Довольные: ${happy}</div>
      <div class="stat-item">😾 Недовольные: ${unhappy}</div>
      <div class="stat-item">⭐ Макс. довольных: ${maxHappyCats}</div>
    `;
    refitBoard();
    positionStats();
  }

  async function draw() {
    await renderBoard(boardEl, game, onCell);
    updateStats();

    if (game.isWin() && !won && !impeached) {
      won = true;
      const timeMs = timer.stop();
      countdown.stop();
      audioManager.stopWarningBeeps();
      elapsedMs = timeMs;
      updateStats();
      markCompleted(level.id);
      const moveRecord = saveLevelRecord(level.id, game.getMoveCount());
      const timeRecord = saveLevelTimeRecord(level.id, timeMs);
      showWinScreen(root, level, {
        moveCount: game.getMoveCount(),
        timeMs,
        moveRecord,
        timeRecord,
        onNext: () => {
          leaveLevel(() => NavigationService.navigate("game", () => showGameScreen(root, level.id + 1), { replace: true }));
        },
        onMenu: () => {
          leaveLevel(() => NavigationService.backTo("levelSelect"));
        }
      });
    } else {
      checkDefeat();
    }
  }
  startTimer();
  draw();
  
  // Ensure positionStats is called after initial rendering
  trackedSetTimeout(() => {
    positionStats();
  }, 100);

  NavigationService.saveCurrentRender(() => showGameScreen(root, levelId));
}
