import { aiChatPrompt, claudePrompt } from "../constants";
import { RendererElements } from "../dom";

type ChatControllerDependencies = {
  elements: RendererElements;
  ipcRenderer: Electron.IpcRenderer;
};

type ChatController = {
  toggleChatMenu: () => void;
};

const showCustomAlert = (message: string, callback?: () => void): void => {
  const overlay = document.createElement("div");
  overlay.className = "custom-alert-overlay";

  const alertBox = document.createElement("div");
  alertBox.className = "custom-alert";
  alertBox.innerHTML = `
    <div class="custom-alert-message">${message}</div>
    <button class="custom-alert-button">OK</button>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(alertBox);

  const okButton = alertBox.querySelector<HTMLButtonElement>(".custom-alert-button");

  const closeAlert = () => {
    document.body.removeChild(overlay);
    document.body.removeChild(alertBox);
    callback?.();
  };

  okButton?.addEventListener("click", closeAlert);
  okButton?.focus();

  alertBox.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === "Escape") {
      event.preventDefault();
      closeAlert();
    }
  });
};

const openChatGPT = (ipcRenderer: Electron.IpcRenderer, content: string): void => {
  const fullText = `${aiChatPrompt}\n\n${content.trim()}`;
  ipcRenderer.send("open-external-url", {
    url: `https://chat.openai.com/?m=${encodeURIComponent(fullText)}`
  });
};

const openClaude = (ipcRenderer: Electron.IpcRenderer, content: string): void => {
  const fullText = `${claudePrompt}\n\n${content.trim()}`;
  ipcRenderer.send("open-external-url", {
    url: `https://claude.ai/new?q=${encodeURIComponent(fullText)}`
  });
};

export const createChatController = ({ elements, ipcRenderer }: ChatControllerDependencies): ChatController => {
  const toggleChatMenu = (): void => {
    const existingPopup = document.querySelector<HTMLDivElement>(".chat-popup");
    if (existingPopup) {
      document.body.removeChild(existingPopup);
      elements.editor.focus();
      return;
    }

    const entryText = elements.editor.value.trim();

    if (entryText.startsWith("Hi. My name is Farza.") || entryText.startsWith("hi. my name is farza.")) {
      showCustomAlert("Sorry, you can't chat with the guide. Please write your own entry.", () => {
        elements.editor.focus();
        const length = elements.editor.value.length;
        elements.editor.setSelectionRange(length, length);
      });
      return;
    }

    if (entryText.length < 350) {
      showCustomAlert("Please free write for at minimum 5 minutes first. Then click this. Trust.", () => {
        elements.editor.focus();
        const length = elements.editor.value.length;
        elements.editor.setSelectionRange(length, length);
      });
      return;
    }

    const popup = document.createElement("div");
    popup.className = "chat-popup";
    popup.setAttribute("tabindex", "-1");
    popup.innerHTML = `
      <div class="chat-popup-content">
        <button id="chatgpt-btn" class="chat-option" tabindex="0">ChatGPT</button>
        <div class="chat-divider"></div>
        <button id="claude-btn" class="chat-option" tabindex="0">Claude</button>
      </div>
    `;

    const rect = elements.chatButton.getBoundingClientRect();
    popup.style.position = "absolute";
    document.body.appendChild(popup);

    popup.style.top = `${rect.top - popup.offsetHeight - 10}px`;
    popup.style.left = `${rect.left}px`;

    document.getElementById("chatgpt-btn")?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      document.body.removeChild(popup);
      elements.editor.focus();
      openChatGPT(ipcRenderer, elements.editor.value);
    });

    document.getElementById("claude-btn")?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      document.body.removeChild(popup);
      elements.editor.focus();
      openClaude(ipcRenderer, elements.editor.value);
    });

    const closePopup = (event: MouseEvent) => {
      const target = event.target as Node;
      if (popup.contains(target) || target === elements.chatButton) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      document.body.removeChild(popup);
      document.removeEventListener("click", closePopup);

      requestAnimationFrame(() => {
        elements.editor.focus();
        const length = elements.editor.value.length;
        elements.editor.setSelectionRange(length, length);
      });
    };

    setTimeout(() => {
      document.addEventListener("click", closePopup);
    }, 100);

    elements.editor.focus();
  };

  return { toggleChatMenu };
};
