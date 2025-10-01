export type Provider = "google" | "cesium" | "custom" | "demo";

export function provider(): Provider {
  const envProvider = (import.meta.env.VITE_TILES_PROVIDER as Provider) || "google";
  
  // Fallback to demo mode if API keys are placeholders
  if (envProvider === "google") {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
    if (!key || key === "__YOUR_GOOGLE_KEY__" || key.length < 10) {
      console.warn("No valid Google API key found, using demo mode");
      return "demo";
    }
  }
  
  return envProvider;
}

export function tilesetURL(): string {
  switch (provider()) {
    case "google":
      return "https://tile.googleapis.com/v1/3dtiles/root.json";
    case "cesium":
      return (import.meta.env.VITE_CESIUM_ION_URL as string) || "";
    case "demo":
      // Return empty string for demo mode - will use fallback terrain
      return "";
    default:
      return (import.meta.env.VITE_CUSTOM_TILES_URL as string) || "";
  }
}

export const googleKey = () => {
  const key = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || "";
  return key === "__YOUR_GOOGLE_KEY__" ? "" : key;
};

export const cesiumToken = () => {
  const token = (import.meta.env.VITE_CESIUM_ION_TOKEN as string) || "";
  return token === "__YOUR_CESIUM_TOKEN__" ? "" : token;
};