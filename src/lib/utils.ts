// src/lib/utils.ts

export const sanitizeFileName = (name: string, fallback: string): string => {
  if (!name || name.trim() === "") return fallback;
  
  const sanitized = name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").trim();
  
  return sanitized || fallback;
};