const fs = require("fs");
const path = require("path");

const CAT_TYPES = [
  "Дон Кихот",
  "Дюма",
  "Гюго",
  "Робеспьер",
  "Гамлет",
  "Максим",
  "Жуков",
  "Есенин",
  "Наполеон",
  "Бальзак",
  "Джек",
  "Драйзер",
  "Штирлиц",
  "Достоевский",
  "Гексли",
  "Габен"
];

// Положительные отношения (дают +1 или +2 к настроению)
const POSITIVE_RELATIONS = new Set([
  "тождество",
  "дуальность",
  "активация",
  "зеркальность",
  "мираж",
  "полудуальность",
  "заказчик",
  "подзаказной"
]);

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Получает плотность котов в процентах от площади поля
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
  return 0.80; // уровень 100
}

// Получает размер поля для уровня
function getBoardSize(levelId) {
  if (levelId <= 90) return { rows: 6, cols: 6 };
  return { rows: 8, cols: 8 }; // уровни 91-100
}

// Упрощённая функция отношений (для проверки проходимости)
function getSimpleRelation(type1, type2) {
  const i = CAT_TYPES.indexOf(type1);
  const j = CAT_TYPES.indexOf(type2);
  if (i === -1 || j === -1) return "деловые";
  
  // Упрощённая матрица отношений (позитивные/нейтральные/негативные)
  const positivePairs = new Set([
    "Дон Кихот-Дюма",
    "Дюма-Дон Кихот",
    "Гюго-Робеспьер",
    "Робеспьер-Гюго",
    "Гамлет-Максим",
    "Максим-Гамлет",
    "Жуков-Есенин",
    "Есенин-Жуков",
    "Наполеон-Бальзак",
    "Бальзак-Наполеон",
    "Джек-Драйзер",
    "Драйзер-Джек",
    "Штирлиц-Достоевский",
    "Достоевский-Штирлиц",
    "Гексли-Габен",
    "Габен-Гексли"
  ]);
  
  if (positivePairs.has(`${type1}-${type2}`)) return "дуальность";
  if (type1 === type2) return "тождество";
  return "деловые";
}

// Проверяет, что у каждого кота есть хотя бы один кот с положительным влиянием
function isSolvable(cats) {
  for (const cat of cats) {
    let hasPositiveNeighbor = false;
    for (const other of cats) {
      if (cat === other) continue;
      const relation = getSimpleRelation(cat.type, other.type);
      if (POSITIVE_RELATIONS.has(relation)) {
        hasPositiveNeighbor = true;
        break;
      }
    }
    if (!hasPositiveNeighbor) {
      return false;
    }
  }
  return true;
}

// Генерирует уровень
function generateLevel(levelId) {
  const density = getDensity(levelId);
  const { rows, cols } = getBoardSize(levelId);
  const totalCells = rows * cols;
  const catCount = Math.floor(totalCells * density);
  
  // Количество воды: примерно 10-15% от площади
  const waterCount = Math.floor(totalCells * 0.12);
  
  // Генерируем воду
  const water = [];
  for (let i = 0; i < waterCount; i++) {
    let r, c;
    do {
      r = Math.floor(Math.random() * rows);
      c = Math.floor(Math.random() * cols);
    } while (water.some(([wr, wc]) => wr === r && wc === c));
    water.push([r, c]);
  }
  
  // Генерируем котов со случайными типами
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

// Специальный уровень 100, посвящается Андрею Бобину — автору оригинальной игры
function generateLevel100() {
  return {
    id: 100,
    name: "Уровень 100. Посвящается Андрею Бобину — автору оригинальной игры",
    rows: 8,
    cols: 8,
    water: [
      [0,0],[0,3],[0,4],[0,7],
      [1,1],[1,6],
      [2,2],[2,5],
      [3,1],[3,3],[3,4],[3,6],
      [4,1],[4,3],[4,4],[4,6],
      [5,2],[5,5],
      [6,1],[6,6],
      [7,0],[7,3],[7,4],[7,7]
    ],
    cats: [
      { type: "Дон Кихот", r: 0, c: 1 },
      { type: "Наполеон", r: 0, c: 2 },
      { type: "Гамлет", r: 0, c: 5 },
      { type: "Габен", r: 0, c: 6 },
      { type: "Бальзак", r: 1, c: 0 },
      { type: "Штирлиц", r: 1, c: 2 },
      { type: "Джек", r: 1, c: 4 },
      { type: "Есенин", r: 1, c: 7 },
      { type: "Максим", r: 2, c: 1 },
      { type: "Гексли", r: 2, c: 3 },
      { type: "Дюма", r: 2, c: 4 },
      { type: "Драйзер", r: 2, c: 6 },
      { type: "Жуков", r: 2, c: 7 },
      { type: "Робеспьер", r: 3, c: 0 },
      { type: "Бальзак", r: 3, c: 2 },
      { type: "Гюго", r: 3, c: 5 },
      { type: "Достоевский", r: 4, c: 0 },
      { type: "Наполеон", r: 4, c: 2 },
      { type: "Штирлиц", r: 4, c: 5 },
      { type: "Гамлет", r: 4, c: 7 },
      { type: "Джек", r: 5, c: 0 },
      { type: "Габен", r: 5, c: 1 },
      { type: "Дюма", r: 5, c: 4 },
      { type: "Робеспьер", r: 5, c: 6 },
      { type: "Есенин", r: 5, c: 7 },
      { type: "Гексли", r: 6, c: 0 },
      { type: "Максим", r: 6, c: 3 },
      { type: "Драйзер", r: 6, c: 4 },
      { type: "Жуков", r: 6, c: 5 },
      { type: "Гюго", r: 6, c: 7 },
      { type: "Бальзак", r: 7, c: 1 },
      { type: "Дон Кихот", r: 7, c: 2 },
      { type: "Наполеон", r: 7, c: 5 },
      { type: "Гамлет", r: 7, c: 6 }
    ]
  };
}

// CLI: node js/tools/generateLevels.js
if (process.argv[1] && process.argv[1].endsWith("generateLevels.js")) {
  const dir = path.join(process.cwd(), "json", "levels");
  
  // Создаём уровни 91-99
  for (let id = 91; id <= 99; id++) {
    const level = generateLevel(id);
    const file = path.join(dir, `level${String(id).padStart(3, "0")}.json`);
    fs.writeFileSync(file, JSON.stringify(level), "utf8");
  }
  
  console.log("Done");
}
