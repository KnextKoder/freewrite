import { dialog } from "electron";
import { autoUpdater } from "electron-updater";

export function setupUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("update-downloaded", (info) => {
    dialog
      .showMessageBox({
        type: "info",
        title: "Update Available",
        message: `A new version of Freewrite (${info.version}) has been downloaded.`,
        detail: "Would you like to restart and update now?",
        buttons: ["Restart & Update", "Later"],
        defaultId: 0,
        cancelId: 1,
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
  });

  autoUpdater.on("error", (err) => {
    console.error("Auto updater error:", err);
  });
  autoUpdater.checkForUpdates();
}
