import { getRelation, MOOD_DELTA } from "./relations.js";

// Настроение кота = сумма влияний соседей-котов, ограниченная [-2, +2].
// Вода и пустые клетки соседями НЕ считаются (см. board.catNeighbors).
export function calcMood(board, r, c) {
  const type = board.typeAt(r, c);
  if (!type) return null;
  let score = 0;
  for (const n of board.catNeighbors(r, c)) {
    const rel = getRelation(type, board.typeAt(n.r, n.c));
    score += (MOOD_DELTA[rel] ?? 0);
  }
  if (score > 2) score = 2;
  if (score < -2) score = -2;
  return score;
}
