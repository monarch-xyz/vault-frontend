// src/utils/parsing.ts
export const safeJsonParse = <T extends unknown>(jsonString: string | undefined | null): T | null => {
  if (!jsonString) return null;
  try {
    return JSON.parse(jsonString) as T;
  } catch (e) {
    console.error("Failed to parse JSON string:", e, "String:", jsonString);
    return null;
  }
}; 