import { RendererElements } from "../dom";
import { Entry, EntriesLoadedPayload, EntryLoadedPayload, RendererState, WelcomeMessagePayload } from "../types";

type EntriesControllerDependencies = {
  elements: RendererElements;
  state: RendererState;
  ipcRenderer: Electron.IpcRenderer;
  updatePlaceholderVisibility: () => void;
};

type EntriesController = {
  initialize: () => void;
  saveCurrentEntry: () => void;
  createNewEntry: () => void;
  toggleSidebar: () => void;
};

const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

export const createEntriesController = ({
  elements,
  state,
  ipcRenderer,
  updatePlaceholderVisibility
}: EntriesControllerDependencies): EntriesController => {
  const renderEntries = (): void => {
    elements.entriesList.innerHTML = "";

    state.entries.forEach((entry) => {
      const entryItem = document.createElement("div");
      entryItem.className = "entry-item";

      if (state.selectedEntry && entry.id === state.selectedEntry.id) {
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
        elements.sidebar.classList.add("is-hidden");
      });

      const deleteButton = entryItem.querySelector<HTMLDivElement>(".entry-delete");
      deleteButton?.addEventListener("click", (event) => {
        event.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this entry?")) {
          return;
        }

        state.entries = state.entries.filter((existingEntry) => existingEntry.id !== entry.id);
        renderEntries();

        if (state.selectedEntry?.id === entry.id) {
          if (state.entries.length > 0) {
            loadEntry(state.entries[0]);
          } else {
            createNewEntry();
          }
        }
      });

      elements.entriesList.appendChild(entryItem);
    });
  };

  const saveCurrentEntry = (): void => {
    if (!state.selectedEntry) {
      return;
    }

    const content = elements.editor.value;
    const preview = content.replace(/\n/g, " ").trim();
    const truncated = preview.length > 30 ? `${preview.substring(0, 30)}...` : preview;

    state.selectedEntry.previewText = truncated;
    state.selectedEntry.content = content;

    ipcRenderer.send("save-entry", {
      content,
      filename: state.selectedEntry.filename
    });

    renderEntries();
  };

  const loadEntry = (entry: Entry): void => {
    if (state.selectedEntry && state.selectedEntry.id !== entry.id) {
      saveCurrentEntry();
    }

    state.selectedEntry = entry;

    if (entry.content) {
      elements.editor.value = entry.content;
    } else {
      ipcRenderer.send("load-entry", { filename: entry.filename });
    }

    updatePlaceholderVisibility();
    renderEntries();
  };

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

    state.entries.unshift(entry);
    loadEntry(entry);

    if (state.entries.length === 1) {
      ipcRenderer.send("load-welcome-message");
    } else {
      elements.editor.value = "\n\n";
    }

    updatePlaceholderVisibility();
    elements.editor.focus();
  };

  const handleEntriesLoaded = (_event: Electron.IpcRendererEvent, data: EntriesLoadedPayload): void => {
    state.entries = data.entries ?? [];
    renderEntries();

    if (state.entries.length > 0) {
      loadEntry(state.entries[0]);
    } else {
      createNewEntry();
    }
  };

  const handleEntryLoaded = (_event: Electron.IpcRendererEvent, data: EntryLoadedPayload): void => {
    if (!data.success) {
      return;
    }

    elements.editor.value = data.content ?? "";
    updatePlaceholderVisibility();
  };

  const handleWelcomeMessageLoaded = (_event: Electron.IpcRendererEvent, data: WelcomeMessagePayload): void => {
    if (!data.success) {
      return;
    }

    elements.editor.value = `\n\n${data.content ?? ""}`;
    updatePlaceholderVisibility();
    saveCurrentEntry();
  };

  const initialize = (): void => {
    ipcRenderer.on("entries-loaded", handleEntriesLoaded);
    ipcRenderer.on("entry-loaded", handleEntryLoaded);
    ipcRenderer.on("welcome-message-loaded", handleWelcomeMessageLoaded);
    ipcRenderer.send("load-entries");
  };

  const toggleSidebar = (): void => {
    elements.sidebar.classList.toggle("is-hidden");
  };

  return {
    initialize,
    saveCurrentEntry,
    createNewEntry,
    toggleSidebar
  };
};
