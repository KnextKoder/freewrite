import { app, ipcMain, IpcMainEvent, shell } from "electron";
import { loadEntries, loadEntry, loadWelcomeMessage, saveEntry } from "./storage";
import { getMainWindow } from "./window";
import { LoadEntryPayload, OpenExternalUrlPayload, SaveEntryPayload } from "./types";

export const registerIpcHandlers = (appRootPath: string): void => {
  ipcMain.on("save-entry", (event: IpcMainEvent, data: SaveEntryPayload) => {
    try {
      const filePath = saveEntry(data.content, data.filename);
      event.reply("save-complete", { success: true, path: filePath });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save entry";
      event.reply("save-complete", { success: false, error: message });
    }
  });

  ipcMain.on("load-entries", async (event: IpcMainEvent) => {
    try {
      const entries = await loadEntries();
      event.reply("entries-loaded", { entries });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load entries";
      event.reply("entries-loaded", { entries: [], error: message });
    }
  });

  ipcMain.on("load-entry", async (event: IpcMainEvent, data: LoadEntryPayload) => {
    try {
      const content = await loadEntry(data.filename);
      event.reply("entry-loaded", { success: true, content });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load entry";
      event.reply("entry-loaded", { success: false, error: message });
    }
  });

  ipcMain.on("toggle-fullscreen", () => {
    const mainWindow = getMainWindow();
    if (!mainWindow) {
      return;
    }

    mainWindow.setFullScreen(!mainWindow.isFullScreen());
  });

  ipcMain.on("get-fullscreen-state", (event: IpcMainEvent) => {
    const mainWindow = getMainWindow();
    if (mainWindow) {
      event.reply("fullscreen-state", mainWindow.isFullScreen());
    }
  });

  ipcMain.on("open-external-url", (_event: IpcMainEvent, data: OpenExternalUrlPayload) => {
    shell.openExternal(data.url);
  });

  ipcMain.on("handle-escape", () => {
    const mainWindow = getMainWindow();
    if (!mainWindow) {
      return;
    }

    if (mainWindow.isFullScreen()) {
      mainWindow.setFullScreen(false);
    } else {
      app.quit();
    }
  });

  ipcMain.on("load-welcome-message", async (event: IpcMainEvent) => {
    try {
      const content = await loadWelcomeMessage(appRootPath);
      event.reply("welcome-message-loaded", { success: true, content });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load welcome message";
      event.reply("welcome-message-loaded", { success: false, error: message });
    }
  });
};
