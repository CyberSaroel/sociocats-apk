const fs = require("fs");
const path = require("path");

const CAT_TYPES = [
  "Дон Кихот", "Дюма", "Гюго", "Робеспьер",
  "Гамлет", "Максим", "Жуков", "Есенин",
  "Наполеон", "Бальзак", "Джек", "Драйзер",
  "Штирлиц", "Достоевский", "Гексли", "Габен"
];

function getDensity(levelId) {
  if (levelId <= 9) return 0.30;
  if (levelId <= 19) return 0.35;
  if (levelId <= 29) return 0.40;
  if (levelId <= 39) return 0.45;
  if (levelId <= 49) return 0.50;
  if (levelId <= 59) return 0.55;
  if (levelId <= 69) return 0.60;
  if (levelId <= 79) return 0.65;
  if (levelId <= 89) return 0.70;
  if (levelId <= 99) return 0.75;
  return 0.80;
}

function getBoardSize(levelId) {
  if (levelId <= 90) return { rows: 6, cols: 6 };
  return { rows: 8, cols: 8 };
}

function generateLevel(levelId) {
  const density = getDensity(levelId);
  const { rows, cols } = getBoardSize(levelId);
  const totalCells = rows * cols;
  const catCount = Math.floor(totalCells * density);
  const waterCount = Math.floor(totalCells * 0.12);
  
  const water = [];
  for (let i = 0; i < waterCount; i++) {
    let r, c;
    do {
      r = Math.floor(Math.random() * rows);
      c = Math.floor(Math.random() * cols);
    } while (water.some(([wr, wc]) => wr === r && wc === c));
    water.push([r, c]);
  }
  
  const cats = [];
  const occupied = new Set(water.map(([r, c]) => `${r},${c}`));
  
  for (let i = 0; i < catCount; i++) {
    let r, c;
    do {
      r = Math.floor(Math.random() * rows);
      c = Math.floor(Math.random() * cols);
    } while (occupied.has(`${r},${c}`) || cats.some(cat => cat.r === r && cat.c === c));
    const randomType = CAT_TYPES[Math.floor(Math.random() * CAT_TYPES.length)];
    cats.push({ type: randomType, r, c });
    occupied.add(`${r},${c}`);
  }
  
  return {
    id: levelId,
    name: `Уровень ${levelId}`,
    rows,
    cols,
    water,
    cats
  };
}

// Генерируем только уровень 11 для теста
const dir = path.join(process.cwd(), "json", "levels");
const level = generateLevel(11);
const file = path.join(dir, `level011.json`);
fs.writeFileSync(file, JSON.stringify(level), "utf8");
console.log("Уровень 11 создан");
