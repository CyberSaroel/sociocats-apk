import { getSelectedSkin } from "../screens/skinSelect.js";
import { fitBoardToViewport } from "./boardLayout.js";
import { bindCellInteraction } from "../ui/cellInteraction.js";

let skinPath = null;

async function loadSkinPath() {
  try {
    const res = await fetch("json/data/skins.json");
    if (!res.ok) return "assets/cats/mood_{mood}.png";
    const data = await res.json();
    const skinId = getSelectedSkin();
    const skin = data.skins.find(s => s.id === skinId);
    return skin ? skin.path : data.skins[0].path;
  } catch {
    return "assets/cats/mood_{mood}.png";
  }
}

// Чистая отрисовка поля по состоянию игры. Клик пробрасывается через onCell(r, c).
export async function renderBoard(container, game, onCell) {
  if (!skinPath) skinPath = await loadSkinPath();

  const board = game.board;
  container.innerHTML = "";
  container.style.setProperty("--rows", board.rows);
  container.style.setProperty("--cols", board.cols);

  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";

      if (board.isWater(r, c)) cell.classList.add("water");
      else if (board.isEmpty(r, c)) cell.classList.add("empty");

      if (game.isSelected(r, c)) cell.classList.add("selected");
      if (game.isTarget(r, c)) cell.classList.add("target");

      if (board.isCat(r, c)) {
        const mood = game.moodAt(r, c);
        cell.dataset.mood = String(mood);
        const img = document.createElement("img");
        img.className = "cat";
        const imgUrl = skinPath.replace("{mood}", mood);
        img.src = imgUrl;
        img.alt = String(mood);
        
        const label = document.createElement("div");
        label.className = "label";
        label.textContent = board.typeAt(r, c);
        cell.appendChild(img);
        cell.appendChild(label);
      }

      const rr = r, cc = c;
      bindCellInteraction(cell, () => onCell(rr, cc));
      container.appendChild(cell);
    }
  }

  fitBoardToViewport(container, board.rows, board.cols);
}

// Сброс кэша скина (для обновления после смены)
export function resetSkinCache() {
  skinPath = null;
}
