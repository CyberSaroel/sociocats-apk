import { getAllRecords } from "../levels/levelRecords.js";
import { audioManager } from "../core/audioManager.js";
import { formatTime } from "../core/levelTimer.js";
import NavigationService from "../core/navigation.js";

export function showRecordsScreen(root) {
  root.innerHTML = "";

  const h = document.createElement("h1");
  h.textContent = "Таблица рекордов";
  root.appendChild(h);

  const backBtn = document.createElement("button");
  backBtn.className = "back-btn";
  backBtn.textContent = "← Вернуться к выбору уровня";
  backBtn.addEventListener("click", () => {
    audioManager.playSoundEffect("assets/sounds/click.mp3");
    NavigationService.goBack();
  });
  root.appendChild(backBtn);

  const p = document.createElement("p");
  p.textContent = "Ваши лучшие результаты по уровням";
  root.appendChild(p);

  const tableContainer = document.createElement("div");
  tableContainer.className = "records-table-container";
  root.appendChild(tableContainer);

  const table = document.createElement("table");
  table.className = "records-table";
  
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  headerRow.innerHTML = `
    <th>Уровень</th>
    <th>Лучший результат (ходов)</th>
    <th>Лучшее время</th>
  `;
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  const records = getAllRecords();
  
  // Sort by level ID
  const sortedLevelIds = Object.keys(records).map(Number).sort((a, b) => a - b);
  
  if (sortedLevelIds.length === 0) {
    const emptyRow = document.createElement("tr");
    const emptyCell = document.createElement("td");
    emptyCell.colSpan = 3;
    emptyCell.textContent = "Пока нет рекордов. Пройдите уровни!";
    emptyRow.appendChild(emptyCell);
    tbody.appendChild(emptyRow);
  } else {
    for (const levelId of sortedLevelIds) {
      const entry = records[levelId];
      const moves = entry.moves !== undefined ? entry.moves : "—";
      const time = entry.timeMs !== undefined ? formatTime(entry.timeMs) : "—";
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>Уровень ${levelId}</td>
        <td>${moves}</td>
        <td>${time}</td>
      `;
      tbody.appendChild(row);
    }
  }
  
  table.appendChild(tbody);
  tableContainer.appendChild(table);

  NavigationService.saveCurrentRender(() => showRecordsScreen(root));
}
