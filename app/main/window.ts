import { app, BrowserWindow, globalShortcut, Menu } from "electron";
import path from "path";

let mainWindow: BrowserWindow | null = null;

export const createMainWindow = (appRootPath: string): BrowserWindow => {
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
    icon: path.join(appRootPath, "assets/icon.png")
  });

  mainWindow.loadFile(path.join(appRootPath, "index.html"));

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  Menu.setApplicationMenu(Menu.buildFromTemplate([]));

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

  return mainWindow;
};

export const getMainWindow = (): BrowserWindow | null => {
  return mainWindow;
};
