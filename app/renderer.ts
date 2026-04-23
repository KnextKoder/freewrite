import { bootstrapRendererApp } from "./core/bootstrap";

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrapRendererApp);
} else {
  bootstrapRendererApp();
}
