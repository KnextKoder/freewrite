export type RendererElements = {
  editor: HTMLTextAreaElement;
  placeholder: HTMLDivElement;
  fontButton: HTMLSpanElement;
  fontSizeButton: HTMLSpanElement;
  systemFontButton: HTMLSpanElement;
  serifFontButton: HTMLSpanElement;
  randomFontButton: HTMLSpanElement;
  timerButton: HTMLSpanElement;
  themeButton: HTMLSpanElement;
  fullscreenButton: HTMLSpanElement;
  newEntryButton: HTMLSpanElement;
  chatButton: HTMLSpanElement;
  historyButton: HTMLSpanElement;
  entriesList: HTMLDivElement;
  fontSizePopup: HTMLDivElement;
  sidebar: HTMLDivElement;
  closeSidebarButton: HTMLButtonElement;
};

const requireElement = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing required element with id: ${id}`);
  }
  return element as T;
};

export const getRendererElements = (): RendererElements => {
  return {
    editor: requireElement<HTMLTextAreaElement>("editor"),
    placeholder: requireElement<HTMLDivElement>("placeholder"),
    fontButton: requireElement<HTMLSpanElement>("font-btn"),
    fontSizeButton: requireElement<HTMLSpanElement>("font-size-btn"),
    systemFontButton: requireElement<HTMLSpanElement>("system-font-btn"),
    serifFontButton: requireElement<HTMLSpanElement>("serif-font-btn"),
    randomFontButton: requireElement<HTMLSpanElement>("random-font-btn"),
    timerButton: requireElement<HTMLSpanElement>("timer-btn"),
    themeButton: requireElement<HTMLSpanElement>("theme-btn"),
    fullscreenButton: requireElement<HTMLSpanElement>("fullscreen-btn"),
    newEntryButton: requireElement<HTMLSpanElement>("new-entry-btn"),
    chatButton: requireElement<HTMLSpanElement>("chat-btn"),
    historyButton: requireElement<HTMLSpanElement>("history-btn"),
    entriesList: requireElement<HTMLDivElement>("entries-list"),
    fontSizePopup: requireElement<HTMLDivElement>("font-size-popup"),
    sidebar: requireElement<HTMLDivElement>("sidebar"),
    closeSidebarButton: requireElement<HTMLButtonElement>("close-sidebar-btn")
  };
};
