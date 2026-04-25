import { getRendererElements } from "./dom";
import { createRendererState } from "./state";
import { createChatController } from "./components/chat";
import { createEditorController } from "./components/editor";
import { createEntriesController } from "./components/entries";
import { createThemeController } from "./components/theme";
import { createTimerController } from "./components/timer";

export const bootstrapRendererApp = (): void => {
  const { ipcRenderer } = window.require("electron") as { ipcRenderer: Electron.IpcRenderer };
  const elements = getRendererElements();
  const state = createRendererState();

  const editorController = createEditorController(elements, state);
  const entriesController = createEntriesController({
    elements,
    state,
    ipcRenderer,
    updatePlaceholderVisibility: editorController.updatePlaceholderVisibility
  });
  const timerController = createTimerController(elements, state, new Audio("https://pomofocus.io/audios/general/button.wav"));
  const themeController = createThemeController(elements);
  const chatController = createChatController({ elements, ipcRenderer });

  const toggleFullscreen = (): void => {
    ipcRenderer.send("toggle-fullscreen");
    document.body.classList.toggle("fullscreen");
    elements.fullscreenButton.textContent = document.body.classList.contains("fullscreen")
      ? "Exit Fullscreen"
      : "Fullscreen";
  };

  ipcRenderer.on("fullscreen-state", (_event, isFullScreen: boolean) => {
    if (isFullScreen) {
      document.body.classList.add("fullscreen");
      elements.fullscreenButton.textContent = "Exit Fullscreen";
    } else {
      document.body.classList.remove("fullscreen");
      elements.fullscreenButton.textContent = "Fullscreen";
    }
  });

  elements.editor.addEventListener("input", () => {
    editorController.updatePlaceholderVisibility();
    entriesController.saveCurrentEntry();
  });

  elements.editor.addEventListener("focus", editorController.updatePlaceholderVisibility);
  elements.editor.addEventListener("blur", entriesController.saveCurrentEntry);

  elements.fontSizeButton.addEventListener("click", editorController.toggleFontSizePopup);
  elements.fontButton.addEventListener("click", () => editorController.setFont("lato"));
  elements.systemFontButton.addEventListener("click", () => editorController.setFont("system"));
  elements.serifFontButton.addEventListener("click", () => editorController.setFont("serif"));
  elements.randomFontButton.addEventListener("click", () => editorController.setFont("random"));

  elements.fontButton.addEventListener("contextmenu", (event) => editorController.toggleFontOptionsMenu(event, "lato"));
  elements.systemFontButton.addEventListener("contextmenu", (event) => editorController.toggleFontOptionsMenu(event, "system"));
  elements.serifFontButton.addEventListener("contextmenu", (event) => editorController.toggleFontOptionsMenu(event, "serif"));
  elements.randomFontButton.addEventListener("contextmenu", (event) => editorController.toggleFontOptionsMenu(event, "random"));

  document.querySelectorAll<HTMLButtonElement>(".size-option").forEach((option) => {
    option.addEventListener("click", () => {
      const size = Number.parseInt(option.getAttribute("data-size") ?? "18", 10);
      editorController.setFontSize(size);
      editorController.closeFontSizePopup();
    });
  });

  elements.timerButton.addEventListener("click", timerController.toggleTimer);
  elements.fullscreenButton.addEventListener("click", toggleFullscreen);
  elements.newEntryButton.addEventListener("click", entriesController.createNewEntry);
  elements.historyButton.addEventListener("click", entriesController.toggleSidebar);
  elements.closeSidebarButton.addEventListener("click", entriesController.toggleSidebar);
  elements.chatButton.addEventListener("click", chatController.toggleChatMenu);
  elements.themeButton.addEventListener("click", themeController.toggleTheme);

  document.addEventListener("click", (event: MouseEvent) => {
    const target = event.target as Node;
    if (!elements.fontSizeButton.contains(target) && !elements.fontSizePopup.contains(target)) {
      editorController.closeFontSizePopup();
    }
  });

  document.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key !== "Escape") {
      return;
    }

    const chatPopup = document.querySelector(".chat-popup");
    if (chatPopup) {
      document.body.removeChild(chatPopup);
      return;
    }

    const fontOptionsPopup = document.querySelector(".font-options-popup");
    if (fontOptionsPopup) {
      document.body.removeChild(fontOptionsPopup);
      return;
    }

    if (elements.fontSizePopup.classList.contains("show")) {
      editorController.closeFontSizePopup();
      return;
    }

    if (!elements.sidebar.classList.contains("is-hidden")) {
      elements.sidebar.classList.add("is-hidden");
      return;
    }

    ipcRenderer.send("handle-escape");
  });

  window.addEventListener("beforeunload", entriesController.saveCurrentEntry);
  setInterval(entriesController.saveCurrentEntry, 30000);

  entriesController.initialize();
  themeController.initialize();
  editorController.initialize();
  ipcRenderer.send("get-fullscreen-state");
};
