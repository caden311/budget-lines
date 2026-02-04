// Minimal typings for Expo/RN to allow `process.env.EXPO_PUBLIC_*` usage without pulling in Node types.
declare const process: {
  env: Record<string, string | undefined>;
};

