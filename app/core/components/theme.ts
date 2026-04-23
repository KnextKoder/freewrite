import { RendererElements } from "../dom";

export const createThemeController = (elements: RendererElements): { initialize: () => void; toggleTheme: () => void } => {
  const updateThemeButton = (theme: string): void => {
    elements.themeButton.textContent = theme === "dark" ? "Light Mode" : "Dark Mode";
  };

  const initialize = (): void => {
    const savedTheme = localStorage.getItem("theme") ?? "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeButton(savedTheme);
  };

  const toggleTheme = (): void => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeButton(newTheme);
  };

  return {
    initialize,
    toggleTheme
  };
};
