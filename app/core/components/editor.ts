import { fonts, placeholderOptions } from "../constants";
import { RendererElements } from "../dom";
import { FontType, RendererState } from "../types";

export type EditorController = {
  initialize: () => void;
  updatePlaceholderVisibility: () => void;
  toggleFontSizePopup: () => void;
  closeFontSizePopup: () => void;
  setFont: (fontType: FontType) => void;
  setFontSize: (size: number) => void;
  toggleFontOptionsMenu: (event: MouseEvent, fontType: FontType) => void;
};

export const createEditorController = (
  elements: RendererElements,
  state: RendererState
): EditorController => {
  const DEFAULT_FONT_TYPE_KEY = "default-font-type";
  const DEFAULT_RANDOM_FONT_KEY = "default-random-font";

  const closeFontOptionsMenu = (): void => {
    const existingPopup = document.querySelector<HTMLDivElement>(".font-options-popup");
    if (existingPopup && existingPopup.parentNode === document.body) {
      document.body.removeChild(existingPopup);
    }
  };

  const updateFontButtonLabels = (): void => {
    elements.fontButton.textContent = state.defaultFontType === "lato" ? "Lato (default)" : "Lato";
    elements.systemFontButton.textContent = state.defaultFontType === "system" ? "System (default)" : "System";
    elements.serifFontButton.textContent = state.defaultFontType === "serif" ? "Serif (default)" : "Serif";

    const randomLabel = state.selectedFontType === "random"
      ? `Random [${state.selectedFont}]`
      : state.defaultFontType === "random" && state.defaultRandomFont
        ? `Random [${state.defaultRandomFont}]`
        : "Random";

    elements.randomFontButton.textContent = state.defaultFontType === "random"
      ? `${randomLabel} (default)`
      : randomLabel;
  };

  const persistDefaultFont = (): void => {
    if (!state.defaultFontType) {
      localStorage.removeItem(DEFAULT_FONT_TYPE_KEY);
      localStorage.removeItem(DEFAULT_RANDOM_FONT_KEY);
      return;
    }

    localStorage.setItem(DEFAULT_FONT_TYPE_KEY, state.defaultFontType);
    if (state.defaultFontType === "random" && state.defaultRandomFont) {
      localStorage.setItem(DEFAULT_RANDOM_FONT_KEY, state.defaultRandomFont);
    } else {
      localStorage.removeItem(DEFAULT_RANDOM_FONT_KEY);
    }
  };

  const setDefaultFont = (): void => {
    state.defaultFontType = state.selectedFontType;
    state.defaultRandomFont = state.selectedFontType === "random" ? state.selectedFont : null;
    persistDefaultFont();
    updateFontButtonLabels();
  };

  const removeDefaultFont = (): void => {
    state.defaultFontType = null;
    state.defaultRandomFont = null;
    persistDefaultFont();
    updateFontButtonLabels();
  };

  const readStoredDefaultFont = (): void => {
    const defaultFontType = localStorage.getItem(DEFAULT_FONT_TYPE_KEY);
    const allowedFontTypes: FontType[] = ["lato", "system", "serif", "random"];

    if (!defaultFontType || !allowedFontTypes.includes(defaultFontType as FontType)) {
      state.defaultFontType = null;
      state.defaultRandomFont = null;
      return;
    }

    state.defaultFontType = defaultFontType as FontType;
    state.defaultRandomFont = state.defaultFontType === "random"
      ? localStorage.getItem(DEFAULT_RANDOM_FONT_KEY)
      : null;
  };

  const updatePlaceholderVisibility = (): void => {
    elements.placeholder.style.display = elements.editor.value.trim() === "" ? "block" : "none";
  };

  const setFont = (fontType: FontType): void => {
    [elements.fontButton, elements.systemFontButton, elements.serifFontButton, elements.randomFontButton].forEach((button) => {
      button.style.fontWeight = "normal";
    });

    state.selectedFontType = fontType;

    if (fontType === "lato") {
      state.selectedFont = fonts.lato;
      elements.fontButton.style.fontWeight = "bold";
    } else if (fontType === "system") {
      state.selectedFont = fonts.system;
      elements.systemFontButton.style.fontWeight = "bold";
    } else if (fontType === "serif") {
      state.selectedFont = fonts.serif;
      elements.serifFontButton.style.fontWeight = "bold";
    } else {
      const randomFont = state.defaultFontType === "random" && state.defaultRandomFont
        ? state.defaultRandomFont
        : fonts.random[Math.floor(Math.random() * fonts.random.length)];
      state.selectedFont = randomFont;
      elements.randomFontButton.style.fontWeight = "bold";
    }

    elements.editor.style.fontFamily = state.selectedFont;
    elements.placeholder.style.fontFamily = state.selectedFont;
    updateFontButtonLabels();
  };

  const setFontSize = (size: number): void => {
    state.fontSize = size;
    elements.fontSizeButton.textContent = `${size}px`;
    elements.editor.style.fontSize = `${size}px`;
    elements.editor.style.lineHeight = "1.6";
    elements.placeholder.style.fontSize = `${size}px`;
  };

  const toggleFontSizePopup = (): void => {
    elements.fontSizePopup.classList.toggle("show");
  };

  const closeFontSizePopup = (): void => {
    elements.fontSizePopup.classList.remove("show");
  };

  const toggleFontOptionsMenu = (event: MouseEvent, fontType: FontType): void => {
    event.preventDefault();
    event.stopPropagation();

    if (fontType !== state.selectedFontType) {
      return;
    }

    const existingPopup = document.querySelector<HTMLDivElement>(".font-options-popup");
    if (existingPopup) {
      closeFontOptionsMenu();
      return;
    }

    const hasDefaultFont = state.defaultFontType !== null;

    const popup = document.createElement("div");
    popup.className = "chat-popup font-options-popup";
    popup.innerHTML = `
      <div class="chat-popup-content" style="width: 170px;">
        <button id="set-default-font-btn" class="chat-option" tabindex="0">Set as default</button>
        <div class="chat-divider"></div>
        <button id="remove-default-font-btn" class="chat-option" tabindex="0" ${hasDefaultFont ? "" : "disabled"}>Remove default</button>
      </div>
    `;

    popup.style.position = "absolute";
    document.body.appendChild(popup);

    const trigger = event.currentTarget as HTMLElement | null;
    if (trigger) {
      const rect = trigger.getBoundingClientRect();
      const verticalGap = 10;
      const minOffset = 8;

      let top = rect.top - popup.offsetHeight - verticalGap;
      if (top < minOffset) {
        top = rect.bottom + verticalGap;
      }

      let left = rect.left;
      if (left + popup.offsetWidth > window.innerWidth - minOffset) {
        left = window.innerWidth - popup.offsetWidth - minOffset;
      }
      if (left < minOffset) {
        left = minOffset;
      }

      popup.style.top = `${top}px`;
      popup.style.left = `${left}px`;
    }

    document.getElementById("set-default-font-btn")?.addEventListener("click", (popupEvent) => {
      popupEvent.preventDefault();
      popupEvent.stopPropagation();
      setDefaultFont();
      closeFontOptionsMenu();
    });

    document.getElementById("remove-default-font-btn")?.addEventListener("click", (popupEvent) => {
      popupEvent.preventDefault();
      popupEvent.stopPropagation();
      if (!hasDefaultFont) {
        return;
      }
      removeDefaultFont();
      closeFontOptionsMenu();
    });

    const closePopup = (clickEvent: MouseEvent) => {
      const target = clickEvent.target as Node;
      if (popup.contains(target)) {
        return;
      }

      closeFontOptionsMenu();
      document.removeEventListener("click", closePopup);
    };

    setTimeout(() => {
      document.addEventListener("click", closePopup);
    }, 0);
  };

  const initialize = (): void => {
    elements.placeholder.textContent = placeholderOptions[Math.floor(Math.random() * placeholderOptions.length)];
    readStoredDefaultFont();

    if (state.defaultFontType === "random" && state.defaultRandomFont) {
      state.selectedFont = state.defaultRandomFont;
      setFont("random");
    } else if (state.defaultFontType) {
      setFont(state.defaultFontType);
    } else {
      setFont("random");
    }

    setFontSize(18);
    updatePlaceholderVisibility();
  };

  return {
    initialize,
    updatePlaceholderVisibility,
    toggleFontSizePopup,
    closeFontSizePopup,
    setFont,
    setFontSize,
    toggleFontOptionsMenu
  };
};
