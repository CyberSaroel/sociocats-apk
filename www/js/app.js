import { showIntroScreen } from "./screens/introScreen.js";
import { applyTheme, getSelectedTheme } from "./screens/themeSelect.js";
import NavigationService from "./core/navigation.js";
import { VERSION } from "./core/version.js";

const root = document.getElementById("app");

// Apply selected theme on load
applyTheme(getSelectedTheme());

// Initialize NavigationService
NavigationService.init(root);

// Set version display
const versionEl = document.getElementById("version-display");
if (versionEl) {
  versionEl.textContent = `v${VERSION}`;
}

// Show intro screen as the first screen (no history entry)
NavigationService.currentScreen = "intro";
NavigationService.saveCurrentRender(() => showIntroScreen(root));
showIntroScreen(root);


// ===== Автообновление игры (Service Worker) =====
if ("serviceWorker" in navigator) {
  let reloading = false;

  // Когда встал новый Service Worker — один раз перезагружаем страницу.
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js", { updateViaCache: "none" })
      .then((reg) => {
        // Раз в минуту тихо проверяем, не вышла ли новая версия.
        setInterval(() => reg.update(), 60 * 1000);
      })
      .catch((err) => {
        console.log("Service Worker не зарегистрировался:", err);
      });
  });
}