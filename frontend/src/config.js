export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const ASSET_URL = import.meta.env.VITE_ASSET_URL || "http://localhost:5000";

export function reportUrl(path) {
  if (!path) return "#";
  return `${ASSET_URL}${path}`;
}
