import { RendererElements } from "../dom";
import { RendererState } from "../types";

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

export const createTimerController = (
  elements: RendererElements,
  state: RendererState,
  buttonSound: HTMLAudioElement
): { toggleTimer: () => void } => {
  const toggleTimer = (): void => {
    buttonSound.play().catch(() => undefined);

    if (state.timerIsRunning) {
      if (state.timerInterval) {
        clearInterval(state.timerInterval);
      }

      state.timerIsRunning = false;
      document.body.classList.remove("timer-running");
      elements.timerButton.textContent = formatTime(state.timeRemaining);
      return;
    }

    state.timerIsRunning = true;
    document.body.classList.add("timer-running");

    state.timerInterval = setInterval(() => {
      state.timeRemaining -= 1;
      elements.timerButton.textContent = formatTime(state.timeRemaining);

      if (state.timeRemaining > 0) {
        return;
      }

      if (state.timerInterval) {
        clearInterval(state.timerInterval);
      }

      state.timerIsRunning = false;
      document.body.classList.remove("timer-running");
      document.body.classList.add("timer-complete");

      setTimeout(() => {
        state.timeRemaining = 900;
        elements.timerButton.textContent = "15:00";
        document.body.classList.remove("timer-complete");
      }, 5000);
    }, 1000);
  };

  return { toggleTimer };
};
