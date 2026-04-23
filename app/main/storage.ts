import { app } from "electron";
import fs from "fs";
import path from "path";
import { EntryMetadata } from "./types";

const getEntriesDirectory = (): string => {
  return path.join(app.getPath("documents"), "Freewrite");
};

const ensureEntriesDirectory = (): string => {
  const documentsPath = getEntriesDirectory();
  if (!fs.existsSync(documentsPath)) {
    fs.mkdirSync(documentsPath, { recursive: true });
  }
  return documentsPath;
};

export const saveEntry = (content: string, filename: string): string => {
  const documentsPath = ensureEntriesDirectory();
  const filePath = path.join(documentsPath, filename);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
};

export const loadEntries = async (): Promise<EntryMetadata[]> => {
  const documentsPath = ensureEntriesDirectory();
  const files = await fs.promises.readdir(documentsPath);

  const entries: EntryMetadata[] = files
    .filter((file) => file.endsWith(".md"))
    .map((filename) => {
      const filePath = path.join(documentsPath, filename);
      const content = fs.readFileSync(filePath, "utf-8");
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
    .filter((entry): entry is EntryMetadata => entry !== null);

  entries.sort((a, b) => {
    const aMatch = a.filename.match(/\[(\d{4}-\d{2}-\d{2})/);
    const bMatch = b.filename.match(/\[(\d{4}-\d{2}-\d{2})/);
    if (!aMatch || !bMatch) {
      return 0;
    }
    return new Date(bMatch[1]).getTime() - new Date(aMatch[1]).getTime();
  });

  return entries;
};

export const loadEntry = async (filename: string): Promise<string> => {
  const filePath = path.join(getEntriesDirectory(), filename);
  return fs.promises.readFile(filePath, "utf-8");
};

export const loadWelcomeMessage = async (appRootPath: string): Promise<string> => {
  const defaultMdPath = path.join(appRootPath, "default.md");
  return fs.promises.readFile(defaultMdPath, "utf-8");
};
