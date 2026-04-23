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
};

export const createEditorController = (
  elements: RendererElements,
  state: RendererState
): EditorController => {
  const updatePlaceholderVisibility = (): void => {
    elements.placeholder.style.display = elements.editor.value.trim() === "" ? "block" : "none";
  };

  const setFont = (fontType: FontType): void => {
    [elements.fontButton, elements.systemFontButton, elements.serifFontButton, elements.randomFontButton].forEach((button) => {
      button.style.fontWeight = "normal";
    });

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
      const randomFont = fonts.random[Math.floor(Math.random() * fonts.random.length)];
      state.selectedFont = randomFont;
      elements.randomFontButton.style.fontWeight = "bold";
      elements.randomFontButton.textContent = `Random [${randomFont}]`;
    }

    elements.editor.style.fontFamily = state.selectedFont;
    elements.placeholder.style.fontFamily = state.selectedFont;
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

  const initialize = (): void => {
    elements.placeholder.textContent = placeholderOptions[Math.floor(Math.random() * placeholderOptions.length)];
    setFont("random");
    setFontSize(18);
    updatePlaceholderVisibility();
  };

  return {
    initialize,
    updatePlaceholderVisibility,
    toggleFontSizePopup,
    closeFontSizePopup,
    setFont,
    setFontSize
  };
};
