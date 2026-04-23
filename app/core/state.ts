import { RendererState } from "./types";

export const createRendererState = (): RendererState => {
  return {
    selectedFont: "Lato-Regular",
    fontSize: 18,
    timeRemaining: 900,
    timerIsRunning: false,
    timerInterval: null,
    entries: [],
    selectedEntry: null
  };
};
