import { app, BrowserWindow, Menu, ipcMain, shell, globalShortcut, IpcMainEvent } from "electron";
import path from "path";
import fs from "fs";

if (require("electron-squirrel-startup")) {
  app.quit();
}

type SaveEntryPayload = {
  content: string;
  filename: string;
};

type LoadEntryPayload = {
  filename: string;
};

type OpenExternalUrlPayload = {
  url: string;
};

type EntryMetadata = {
  id: string;
  date: string;
  filename: string;
  previewText: string;
  content: string;
};

let mainWindow: BrowserWindow | null = null;

const getEntriesDirectory = (): string => {
  return path.join(app.getPath("documents"), "Freewrite");
};

const ensureEntriesDirectory = (): string => {
  const documentsPath = getEntriesDirectory();
  if (!fs.existsSync(documentsPath)) {
    fs.mkdirSync(documentsPath, { recursive: true });
  }
  return documentsPath;
};

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    frame: false,
    titleBarStyle: "hidden",
    backgroundColor: "#FFFFFF",
    show: false,
    roundedCorners: false,
    icon: path.join(__dirname, "assets/icon.png")
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  const menu = Menu.buildFromTemplate([]);
  Menu.setApplicationMenu(menu);

  mainWindow.on("focus", () => {
    globalShortcut.register("Escape", () => {
      if (!mainWindow) {
        return;
      }
      if (mainWindow.isFullScreen()) {
        mainWindow.setFullScreen(false);
      } else {
        app.quit();
      }
    });
  });

  mainWindow.on("blur", () => {
    globalShortcut.unregisterAll();
  });

  mainWindow.on("closed", () => {
    globalShortcut.unregisterAll();
    mainWindow = null;
  });
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.on("save-entry", (event: IpcMainEvent, data: SaveEntryPayload) => {
  const documentsPath = ensureEntriesDirectory();
  const filePath = path.join(documentsPath, data.filename);

  fs.writeFileSync(filePath, data.content, "utf-8");
  event.reply("save-complete", { success: true, path: filePath });
});

ipcMain.on("load-entries", (event: IpcMainEvent) => {
  const documentsPath = ensureEntriesDirectory();

  fs.readdir(documentsPath, (err, files) => {
    if (err) {
      event.reply("entries-loaded", { entries: [], error: err.message });
      return;
    }

    const entries: EntryMetadata[] = files
      .filter((file) => file.endsWith(".md"))
      .map((filename) => {
        const filePath = path.join(documentsPath, filename);
        const content = fs.readFileSync(filePath, "utf-8");
        const preview = content.replace(/\n/g, " ").trim();
        const previewText = `${preview.substring(0, 30)}${preview.length > 30 ? "..." : ""}`;

        const uuidMatch = filename.match(/\[(.*?)\]/);
        const dateMatch = filename.match(/\[(\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2})\]/);

        if (!uuidMatch || !dateMatch) {
          return null;
        }

        const [year, month, day] = dateMatch[1].split("-");
        const date = new Date(Number(year), Number(month) - 1, Number(day));

        return {
          id: uuidMatch[1],
          date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          filename,
          previewText,
          content
        };
      })
      .filter((entry): entry is EntryMetadata => entry !== null);

    entries.sort((a, b) => {
      const aMatch = a.filename.match(/\[(\d{4}-\d{2}-\d{2})/);
      const bMatch = b.filename.match(/\[(\d{4}-\d{2}-\d{2})/);
      if (!aMatch || !bMatch) {
        return 0;
      }
      return new Date(bMatch[1]).getTime() - new Date(aMatch[1]).getTime();
    });

    event.reply("entries-loaded", { entries });
  });
});

ipcMain.on("load-entry", (event: IpcMainEvent, data: LoadEntryPayload) => {
  const filePath = path.join(getEntriesDirectory(), data.filename);

  fs.readFile(filePath, "utf-8", (err, content) => {
    if (err) {
      event.reply("entry-loaded", { success: false, error: err.message });
      return;
    }

    event.reply("entry-loaded", { success: true, content });
  });
});

ipcMain.on("toggle-fullscreen", () => {
  if (!mainWindow) {
    return;
  }
  mainWindow.setFullScreen(!mainWindow.isFullScreen());
});

ipcMain.on("get-fullscreen-state", (event: IpcMainEvent) => {
  if (mainWindow) {
    event.reply("fullscreen-state", mainWindow.isFullScreen());
  }
});

ipcMain.on("open-external-url", (_event: IpcMainEvent, data: OpenExternalUrlPayload) => {
  shell.openExternal(data.url);
});

ipcMain.on("handle-escape", () => {
  if (!mainWindow) {
    return;
  }

  if (mainWindow.isFullScreen()) {
    mainWindow.setFullScreen(false);
  } else {
    app.quit();
  }
});

ipcMain.on("load-welcome-message", (event: IpcMainEvent) => {
  const defaultMdPath = path.join(__dirname, "default.md");

  fs.readFile(defaultMdPath, "utf-8", (err, content) => {
    if (err) {
      event.reply("welcome-message-loaded", { success: false, error: err.message });
      return;
    }

    event.reply("welcome-message-loaded", { success: true, content });
  });
});
