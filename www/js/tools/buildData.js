import fs from "node:fs";
import path from "node:path";
import { TYPES } from "../js/socionics/types.js";
import { RELATION_MATRIX, MOOD_DELTA, SHORT } from "../js/socionics/relations.js";

const file = path.join(process.cwd(), "data", "relationMatrix.json");
const data = JSON.parse(fs.readFileSync(file, "utf8"));
data.order  = TYPES;
data.delta  = MOOD_DELTA;
data.short  = SHORT;
data.matrix = RELATION_MATRIX; // 16x16 названий отношений из проверенного алгоритма
fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
console.log("data/relationMatrix.json: записаны matrix (16x16), delta и short");
