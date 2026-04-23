import { app, BrowserWindow } from "electron";
import { registerIpcHandlers } from "./main/ipc";
import { createMainWindow } from "./main/window";

if (require("electron-squirrel-startup")) {
  app.quit();
}

const appRootPath = app.getAppPath();

app.whenReady().then(() => {
  createMainWindow(appRootPath);
  registerIpcHandlers(appRootPath);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow(appRootPath);
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
