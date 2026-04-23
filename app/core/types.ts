export type FontType = "lato" | "system" | "serif" | "random";

export type Entry = {
  id: string;
  date: string;
  filename: string;
  previewText: string;
  content?: string;
};

export type EntriesLoadedPayload = {
  entries?: Entry[];
  error?: string;
};

export type EntryLoadedPayload = {
  success: boolean;
  content?: string;
  error?: string;
};

export type WelcomeMessagePayload = {
  success: boolean;
  content?: string;
  error?: string;
};

export type RendererState = {
  selectedFont: string;
  fontSize: number;
  timeRemaining: number;
  timerIsRunning: boolean;
  timerInterval: ReturnType<typeof setInterval> | null;
  entries: Entry[];
  selectedEntry: Entry | null;
};
