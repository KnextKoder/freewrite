"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
if (require("electron-squirrel-startup")) {
    electron_1.app.quit();
}
let mainWindow = null;
const getEntriesDirectory = () => {
    return path_1.default.join(electron_1.app.getPath("documents"), "Freewrite");
};
const ensureEntriesDirectory = () => {
    const documentsPath = getEntriesDirectory();
    if (!fs_1.default.existsSync(documentsPath)) {
        fs_1.default.mkdirSync(documentsPath, { recursive: true });
    }
    return documentsPath;
};
const createWindow = () => {
    mainWindow = new electron_1.BrowserWindow({
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
        icon: path_1.default.join(__dirname, "assets/icon.png")
    });
    mainWindow.loadFile(path_1.default.join(__dirname, "index.html"));
    mainWindow.once("ready-to-show", () => {
        mainWindow?.show();
    });
    const menu = electron_1.Menu.buildFromTemplate([]);
    electron_1.Menu.setApplicationMenu(menu);
    mainWindow.on("focus", () => {
        electron_1.globalShortcut.register("Escape", () => {
            if (!mainWindow) {
                return;
            }
            if (mainWindow.isFullScreen()) {
                mainWindow.setFullScreen(false);
            }
            else {
                electron_1.app.quit();
            }
        });
    });
    mainWindow.on("blur", () => {
        electron_1.globalShortcut.unregisterAll();
    });
    mainWindow.on("closed", () => {
        electron_1.globalShortcut.unregisterAll();
        mainWindow = null;
    });
};
electron_1.app.whenReady().then(() => {
    createWindow();
    electron_1.app.on("activate", () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        electron_1.app.quit();
    }
});
electron_1.ipcMain.on("save-entry", (event, data) => {
    const documentsPath = ensureEntriesDirectory();
    const filePath = path_1.default.join(documentsPath, data.filename);
    fs_1.default.writeFileSync(filePath, data.content, "utf-8");
    event.reply("save-complete", { success: true, path: filePath });
});
electron_1.ipcMain.on("load-entries", (event) => {
    const documentsPath = ensureEntriesDirectory();
    fs_1.default.readdir(documentsPath, (err, files) => {
        if (err) {
            event.reply("entries-loaded", { entries: [], error: err.message });
            return;
        }
        const entries = files
            .filter((file) => file.endsWith(".md"))
            .map((filename) => {
            const filePath = path_1.default.join(documentsPath, filename);
            const content = fs_1.default.readFileSync(filePath, "utf-8");
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
            .filter((entry) => entry !== null);
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
electron_1.ipcMain.on("load-entry", (event, data) => {
    const filePath = path_1.default.join(getEntriesDirectory(), data.filename);
    fs_1.default.readFile(filePath, "utf-8", (err, content) => {
        if (err) {
            event.reply("entry-loaded", { success: false, error: err.message });
            return;
        }
        event.reply("entry-loaded", { success: true, content });
    });
});
electron_1.ipcMain.on("toggle-fullscreen", () => {
    if (!mainWindow) {
        return;
    }
    mainWindow.setFullScreen(!mainWindow.isFullScreen());
});
electron_1.ipcMain.on("get-fullscreen-state", (event) => {
    if (mainWindow) {
        event.reply("fullscreen-state", mainWindow.isFullScreen());
    }
});
electron_1.ipcMain.on("open-external-url", (_event, data) => {
    electron_1.shell.openExternal(data.url);
});
electron_1.ipcMain.on("handle-escape", () => {
    if (!mainWindow) {
        return;
    }
    if (mainWindow.isFullScreen()) {
        mainWindow.setFullScreen(false);
    }
    else {
        electron_1.app.quit();
    }
});
electron_1.ipcMain.on("load-welcome-message", (event) => {
    const defaultMdPath = path_1.default.join(__dirname, "default.md");
    fs_1.default.readFile(defaultMdPath, "utf-8", (err, content) => {
        if (err) {
            event.reply("welcome-message-loaded", { success: false, error: err.message });
            return;
        }
        event.reply("welcome-message-loaded", { success: true, content });
    });
});
