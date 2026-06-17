import Constants from "expo-constants";

/**
 * Gets the Mapbox token from environment variables.
 */
export const getMapboxToken = (): string => {
  return process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";
};

/**
 * Checks if the application is running inside the standard Expo Go app.
 * Native modules like @rnmapbox/maps cannot run inside Expo Go.
 */
export const isExpoGo = (): boolean => {
  // Constants.appOwnership is 'expo' inside Expo Go, and Constants.executionEnvironment is 'store-client'
  return (
    Constants.appOwnership === "expo" ||
    (Constants as any).executionEnvironment === "store-client"
  );
};

/**
 * Determines whether the Mapbox MapView can be safely rendered without causing a crash.
 */
export const canRenderMapbox = (): boolean => {
  const token = getMapboxToken();
  const isGo = isExpoGo();

  console.log("[MapboxHelper] Check Mapbox capability:", {
    hasToken: typeof token === "string" && token.length > 0,
    tokenLength: token ? token.length : 0,
    tokenPrefix: token ? token.substring(0, 15) : "",
    tokenSuffix: token && token.length > 15 ? token.substring(token.length - 15) : "",
    isExpoGo: isGo
  });

  const hasToken =
    typeof token === "string" &&
    token.trim().length > 0 &&
    !token.includes("your_mapbox_public_token_here");
  return hasToken && !isGo;
};
