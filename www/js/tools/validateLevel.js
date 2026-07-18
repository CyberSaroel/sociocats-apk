import fs from "node:fs";
import { Board } from "../js/core/board.js";
import { canMove, applyMove } from "../js/core/movement.js";
import { calcMood } from "../js/socionics/mood.js";
import { isWin } from "../js/core/victory.js";

function serialize(board) {
  const cats = [], water = [];
  for (let r = 0; r < board.rows; r++)
    for (let c = 0; c < board.cols; c++) {
      if (board.isCat(r, c)) cats.push({ type: board.typeAt(r, c), r, c });
      else if (board.isWater(r, c)) water.push([r, c]);
    }
  return { rows: board.rows, cols: board.cols, cats, water };
}

function totalMood(board) {
  return board.allCats().reduce((s, { r, c }) => s + calcMood(board, r, c), 0);
}

function legalMoves(board) {
  const moves = [];
  for (const cat of board.allCats())
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const to = { r: cat.r + dr, c: cat.c + dc };
        if (canMove(board, cat, to)) moves.push({ from: { r: cat.r, c: cat.c }, to });
      }
  return moves;
}

function pickMove(board) {
  const moves = legalMoves(board);
  if (moves.length === 0) return null;
  if (Math.random() < 0.2) return moves[Math.floor(Math.random() * moves.length)];
  const base = totalMood(board);
  let best = null, bestGain = -Infinity;
  for (const m of moves) {
    const clone = Board.fromLevel(serialize(board));
    applyMove(clone, m.from, m.to);
    const gain = (totalMood(clone) - base) + Math.random() * 0.5;
    if (gain > bestGain) { bestGain = gain; best = m; }
  }
  return best;
}

// Эвристический поиск решения (жадность + случайные рестарты).
export function trySolve(level, { restarts = 300, maxSteps = 400 } = {}) {
  for (let a = 0; a < restarts; a++) {
    const board = Board.fromLevel(level);
    for (let s = 0; s < maxSteps; s++) {
      if (isWin(board)) return true;
      const m = pickMove(board);
      if (!m) break;
      applyMove(board, m.from, m.to);
    }
    if (isWin(board)) return true;
  }
  return false;
}

// CLI: node tools/validateLevel.js levels/level001.json
if (process.argv[1] && process.argv[1].endsWith("validateLevel.js")) {
  const file = process.argv[2];
  const level = JSON.parse(fs.readFileSync(file, "utf8"));
  const ok = trySolve(level);
  console.log(`${file}: ${ok ? "РЕШАЕМ ✅" : "решение не найдено ❌"}`);
  process.exit(ok ? 0 : 1);
}
