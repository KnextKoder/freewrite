export type SaveEntryPayload = {
  content: string;
  filename: string;
};

export type LoadEntryPayload = {
  filename: string;
};

export type OpenExternalUrlPayload = {
  url: string;
};

export type EntryMetadata = {
  id: string;
  date: string;
  filename: string;
  previewText: string;
  content: string;
};
