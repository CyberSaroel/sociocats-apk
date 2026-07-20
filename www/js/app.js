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
