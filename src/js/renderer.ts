const { ipcRenderer } = window.require("electron") as { ipcRenderer: Electron.IpcRenderer };

type FontType = "lato" | "system" | "serif" | "random";

type Entry = {
  id: string;
  date: string;
  filename: string;
  previewText: string;
  content?: string;
};

type EntriesLoadedPayload = {
  entries?: Entry[];
  error?: string;
};

type EntryLoadedPayload = {
  success: boolean;
  content?: string;
  error?: string;
};

type WelcomeMessagePayload = {
  success: boolean;
  content?: string;
  error?: string;
};

const requireElement = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing required element with id: ${id}`);
  }
  return element as T;
};

const editor = requireElement<HTMLTextAreaElement>("editor");
const placeholder = requireElement<HTMLDivElement>("placeholder");
const fontButton = requireElement<HTMLSpanElement>("font-btn");
const fontSizeButton = requireElement<HTMLSpanElement>("font-size-btn");
const systemFontButton = requireElement<HTMLSpanElement>("system-font-btn");
const serifFontButton = requireElement<HTMLSpanElement>("serif-font-btn");
const randomFontButton = requireElement<HTMLSpanElement>("random-font-btn");
const timerButton = requireElement<HTMLSpanElement>("timer-btn");
const themeButton = requireElement<HTMLSpanElement>("theme-btn");
const fullscreenButton = requireElement<HTMLSpanElement>("fullscreen-btn");
const newEntryButton = requireElement<HTMLSpanElement>("new-entry-btn");
const chatButton = requireElement<HTMLSpanElement>("chat-btn");
const historyButton = requireElement<HTMLSpanElement>("history-btn");
const entriesList = requireElement<HTMLDivElement>("entries-list");
const fontSizePopup = requireElement<HTMLDivElement>("font-size-popup");
const sidebar = requireElement<HTMLDivElement>("sidebar");
const closeSidebarButton = requireElement<HTMLButtonElement>("close-sidebar-btn");

const buttonSound = new Audio("https://pomofocus.io/audios/general/button.wav");

let selectedFont = "Lato-Regular";
let fontSize = 18;
let timeRemaining = 900;
let timerIsRunning = false;
let timerInterval: ReturnType<typeof setInterval> | null = null;
let entries: Entry[] = [];
let selectedEntry: Entry | null = null;

const placeholderOptions = [
  "Begin writing",
  "Pick a thought and go",
  "Start typing",
  "What's on your mind",
  "Just start",
  "Type your first thought",
  "Start with one sentence",
  "Just say it"
];

const aiChatPrompt = `below is my journal entry. wyt? talk through it with me like a friend. don't therpaize me and give me a whole breakdown, don't repeat my thoughts with headings. really take all of this, and tell me back stuff truly as if you're an old homie.

Keep it casual, dont say yo, help me make new connections i don't see, comfort, validate, challenge, all of it. dont be afraid to say a lot. format with markdown headings if needed.

do not just go through every single thing i say, and say it back to me. you need to proccess everythikng is say, make connections i don't see it, and deliver it all back to me as a story that makes me feel what you think i wanna feel. thats what the best therapists do.

ideally, you're style/tone should sound like the user themselves. it's as if the user is hearing their own tone but it should still feel different, because you have different things to say and don't just repeat back they say.

else, start by saying, "hey, thanks for showing me this. my thoughts:"

my entry:`;

const claudePrompt = `Take a look at my journal entry below. I'd like you to analyze it and respond with deep insight that feels personal, not clinical.
Imagine you're not just a friend, but a mentor who truly gets both my tech background and my psychological patterns. I want you to uncover the deeper meaning and emotional undercurrents behind my scattered thoughts.
Keep it casual, dont say yo, help me make new connections i don't see, comfort, validate, challenge, all of it. dont be afraid to say a lot. format with markdown headings if needed.
Use vivid metaphors and powerful imagery to help me see what I'm really building. Organize your thoughts with meaningful headings that create a narrative journey through my ideas.
Don't just validate my thoughts - reframe them in a way that shows me what I'm really seeking beneath the surface. Go beyond the product concepts to the emotional core of what I'm trying to solve.
Be willing to be profound and philosophical without sounding like you're giving therapy. I want someone who can see the patterns I can't see myself and articulate them in a way that feels like an epiphany.
Start with 'hey, thanks for showing me this. my thoughts:' and then use markdown headings to structure your response.

Here's my journal entry:`;

const fonts = {
  lato: "Lato-Regular",
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  serif: "Times New Roman, serif",
  random: ["Noto Serif Kannada", "Georgia", "Palatino", "Garamond", "Bookman", "Courier New"]
};

document.addEventListener("DOMContentLoaded", () => {
  loadEntries();
  initializeEventListeners();
  initializeTheme();

  placeholder.textContent = placeholderOptions[Math.floor(Math.random() * placeholderOptions.length)];
  setFont("random");
  setFontSize(18);
  updatePlaceholderVisibility();

  ipcRenderer.send("get-fullscreen-state");
});

ipcRenderer.on("fullscreen-state", (_event, isFullScreen: boolean) => {
  if (isFullScreen) {
    document.body.classList.add("fullscreen");
    fullscreenButton.textContent = "Exit Fullscreen";
  } else {
    document.body.classList.remove("fullscreen");
    fullscreenButton.textContent = "Fullscreen";
  }
});

const initializeEventListeners = (): void => {
  editor.addEventListener("input", () => {
    updatePlaceholderVisibility();
    saveCurrentEntry();
  });

  editor.addEventListener("focus", updatePlaceholderVisibility);
  editor.addEventListener("blur", saveCurrentEntry);

  fontSizeButton.addEventListener("click", () => togglePopup(fontSizePopup));

  fontButton.addEventListener("click", () => setFont("lato"));
  systemFontButton.addEventListener("click", () => setFont("system"));
  serifFontButton.addEventListener("click", () => setFont("serif"));
  randomFontButton.addEventListener("click", () => setFont("random"));

  document.querySelectorAll<HTMLButtonElement>(".size-option").forEach((option) => {
    option.addEventListener("click", () => {
      const size = Number.parseInt(option.getAttribute("data-size") ?? "18", 10);
      setFontSize(size);
      fontSizePopup.classList.remove("show");
    });
  });

  timerButton.addEventListener("click", toggleTimer);
  fullscreenButton.addEventListener("click", toggleFullscreen);
  newEntryButton.addEventListener("click", createNewEntry);
  historyButton.addEventListener("click", toggleSidebar);
  closeSidebarButton.addEventListener("click", toggleSidebar);
  chatButton.addEventListener("click", toggleChatMenu);

  document.addEventListener("click", (event: MouseEvent) => {
    const target = event.target as Node;
    if (!fontSizeButton.contains(target) && !fontSizePopup.contains(target)) {
      fontSizePopup.classList.remove("show");
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

    if (fontSizePopup.classList.contains("show")) {
      fontSizePopup.classList.remove("show");
      return;
    }

    if (!sidebar.classList.contains("is-hidden")) {
      sidebar.classList.add("is-hidden");
      return;
    }

    ipcRenderer.send("handle-escape");
  });

  themeButton.addEventListener("click", toggleTheme);

  window.addEventListener("beforeunload", saveCurrentEntry);
  setInterval(saveCurrentEntry, 30000);
};

const updatePlaceholderVisibility = (): void => {
  placeholder.style.display = editor.value.trim() === "" ? "block" : "none";
};

const togglePopup = (popup: HTMLElement): void => {
  popup.classList.toggle("show");
};

const setFont = (fontType: FontType): void => {
  [fontButton, systemFontButton, serifFontButton, randomFontButton].forEach((button) => {
    button.style.fontWeight = "normal";
  });

  if (fontType === "lato") {
    selectedFont = fonts.lato;
    fontButton.style.fontWeight = "bold";
  } else if (fontType === "system") {
    selectedFont = fonts.system;
    systemFontButton.style.fontWeight = "bold";
  } else if (fontType === "serif") {
    selectedFont = fonts.serif;
    serifFontButton.style.fontWeight = "bold";
  } else {
    const randomFont = fonts.random[Math.floor(Math.random() * fonts.random.length)];
    selectedFont = randomFont;
    randomFontButton.style.fontWeight = "bold";
    randomFontButton.textContent = `Random [${randomFont}]`;
  }

  editor.style.fontFamily = selectedFont;
  placeholder.style.fontFamily = selectedFont;
};

const setFontSize = (size: number): void => {
  fontSize = size;
  fontSizeButton.textContent = `${size}px`;
  editor.style.fontSize = `${size}px`;
  editor.style.lineHeight = "1.6";
  placeholder.style.fontSize = `${size}px`;
};

const toggleTimer = (): void => {
  buttonSound.play().catch(() => undefined);

  if (timerIsRunning) {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    timerIsRunning = false;
    document.body.classList.remove("timer-running");
    timerButton.textContent = formatTime(timeRemaining);
    return;
  }

  timerIsRunning = true;
  document.body.classList.add("timer-running");

  timerInterval = setInterval(() => {
    timeRemaining -= 1;
    timerButton.textContent = formatTime(timeRemaining);

    if (timeRemaining > 0) {
      return;
    }

    if (timerInterval) {
      clearInterval(timerInterval);
    }

    timerIsRunning = false;
    document.body.classList.remove("timer-running");
    document.body.classList.add("timer-complete");

    setTimeout(() => {
      timeRemaining = 900;
      timerButton.textContent = "15:00";
      document.body.classList.remove("timer-complete");
    }, 5000);
  }, 1000);
};

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

const toggleFullscreen = (): void => {
  ipcRenderer.send("toggle-fullscreen");
  document.body.classList.toggle("fullscreen");
  fullscreenButton.textContent = document.body.classList.contains("fullscreen")
    ? "Exit Fullscreen"
    : "Fullscreen";
};

const toggleSidebar = (): void => {
  sidebar.classList.toggle("is-hidden");
};

const loadEntries = (): void => {
  ipcRenderer.send("load-entries");

  ipcRenderer.on("entries-loaded", (_event, data: EntriesLoadedPayload) => {
    entries = data.entries ?? [];
    renderEntries();

    if (entries.length > 0) {
      loadEntry(entries[0]);
    } else {
      createNewEntry();
    }
  });
};

const renderEntries = (): void => {
  entriesList.innerHTML = "";

  entries.forEach((entry) => {
    const entryItem = document.createElement("div");
    entryItem.className = "entry-item";

    if (selectedEntry && entry.id === selectedEntry.id) {
      entryItem.classList.add("selected");
    }

    entryItem.innerHTML = `
      <div class="entry-date mb-[2px] text-[13px]">${entry.date}</div>
      <div class="entry-preview overflow-hidden whitespace-nowrap text-ellipsis text-[12px]">${entry.previewText || "Empty entry"}</div>
      <div class="entry-delete absolute right-[10px] top-1/2 cursor-pointer text-[14px] opacity-0" style="transform: translateY(-50%);">&times;</div>
    `;

    entryItem.addEventListener("click", (event: MouseEvent) => {
      if ((event.target as HTMLElement).classList.contains("entry-delete")) {
        return;
      }
      loadEntry(entry);
      sidebar.classList.add("is-hidden");
    });

    const deleteButton = entryItem.querySelector<HTMLDivElement>(".entry-delete");
    deleteButton?.addEventListener("click", (event) => {
      event.stopPropagation();
      if (!window.confirm("Are you sure you want to delete this entry?")) {
        return;
      }

      entries = entries.filter((existingEntry) => existingEntry.id !== entry.id);
      renderEntries();

      if (selectedEntry?.id === entry.id) {
        if (entries.length > 0) {
          loadEntry(entries[0]);
        } else {
          createNewEntry();
        }
      }
    });

    entriesList.appendChild(entryItem);
  });
};

const loadEntry = (entry: Entry): void => {
  if (selectedEntry && selectedEntry.id !== entry.id) {
    saveCurrentEntry();
  }

  selectedEntry = entry;

  if (entry.content) {
    editor.value = entry.content;
  } else {
    ipcRenderer.send("load-entry", { filename: entry.filename });
  }

  updatePlaceholderVisibility();
  renderEntries();
};

ipcRenderer.on("entry-loaded", (_event, data: EntryLoadedPayload) => {
  if (!data.success) {
    return;
  }

  editor.value = data.content ?? "";
  updatePlaceholderVisibility();
});

const createNewEntry = (): void => {
  const id = generateUUID();
  const now = new Date();

  const dateString = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0")
  ].join("-");

  const entry: Entry = {
    id,
    date: now.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    filename: `[${id}]-[${dateString}].md`,
    previewText: "",
    content: "\n\n"
  };

  entries.unshift(entry);
  loadEntry(entry);

  if (entries.length === 1) {
    ipcRenderer.send("load-welcome-message");
  } else {
    editor.value = "\n\n";
  }

  updatePlaceholderVisibility();
  editor.focus();
};

ipcRenderer.on("welcome-message-loaded", (_event, data: WelcomeMessagePayload) => {
  if (!data.success) {
    return;
  }

  editor.value = `\n\n${data.content ?? ""}`;
  updatePlaceholderVisibility();
  saveCurrentEntry();
});

const saveCurrentEntry = (): void => {
  if (!selectedEntry) {
    return;
  }

  const content = editor.value;
  const preview = content.replace(/\n/g, " ").trim();
  const truncated = preview.length > 30 ? `${preview.substring(0, 30)}...` : preview;

  selectedEntry.previewText = truncated;
  selectedEntry.content = content;

  ipcRenderer.send("save-entry", {
    content,
    filename: selectedEntry.filename
  });

  renderEntries();
};

const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
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

const toggleChatMenu = (): void => {
  const existingPopup = document.querySelector<HTMLDivElement>(".chat-popup");
  if (existingPopup) {
    document.body.removeChild(existingPopup);
    editor.focus();
    return;
  }

  const entryText = editor.value.trim();

  if (entryText.startsWith("Hi. My name is Farza.") || entryText.startsWith("hi. my name is farza.")) {
    showCustomAlert("Sorry, you can't chat with the guide. Please write your own entry.", () => {
      editor.focus();
      const length = editor.value.length;
      editor.setSelectionRange(length, length);
    });
    return;
  }

  if (entryText.length < 350) {
    showCustomAlert("Please free write for at minimum 5 minutes first. Then click this. Trust.", () => {
      editor.focus();
      const length = editor.value.length;
      editor.setSelectionRange(length, length);
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

  const rect = chatButton.getBoundingClientRect();
  popup.style.position = "absolute";
  document.body.appendChild(popup);

  popup.style.top = `${rect.top - popup.offsetHeight - 10}px`;
  popup.style.left = `${rect.left}px`;

  document.getElementById("chatgpt-btn")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    document.body.removeChild(popup);
    editor.focus();
    openChatGPT();
  });

  document.getElementById("claude-btn")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    document.body.removeChild(popup);
    editor.focus();
    openClaude();
  });

  const closePopup = (event: MouseEvent) => {
    const target = event.target as Node;
    if (popup.contains(target) || target === chatButton) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    document.body.removeChild(popup);
    document.removeEventListener("click", closePopup);

    requestAnimationFrame(() => {
      editor.focus();
      const length = editor.value.length;
      editor.setSelectionRange(length, length);
    });
  };

  setTimeout(() => {
    document.addEventListener("click", closePopup);
  }, 100);

  editor.focus();
};

const openChatGPT = (): void => {
  const fullText = `${aiChatPrompt}\n\n${editor.value.trim()}`;
  ipcRenderer.send("open-external-url", {
    url: `https://chat.openai.com/?m=${encodeURIComponent(fullText)}`
  });
};

const openClaude = (): void => {
  const fullText = `${claudePrompt}\n\n${editor.value.trim()}`;
  ipcRenderer.send("open-external-url", {
    url: `https://claude.ai/new?q=${encodeURIComponent(fullText)}`
  });
};

const initializeTheme = (): void => {
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

const updateThemeButton = (theme: string): void => {
  themeButton.textContent = theme === "dark" ? "Light Mode" : "Dark Mode";
};
