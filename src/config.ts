/**
 * Runtime configuration flags.
 *
 * Expo supports injecting env vars into the JS bundle when they are prefixed with:
 * - EXPO_PUBLIC_
 *
 * Usage (local):
 *   EXPO_PUBLIC_UNLIMITED_HINTS=true npx expo start
 */

function readBoolEnv(value: string | undefined): boolean {
  if (!value) return false;
  switch (value.trim().toLowerCase()) {
    case '1':
    case 'true':
    case 'yes':
    case 'y':
    case 'on':
      return true;
    default:
      return false;
  }
}

export const UNLIMITED_HINTS_ENABLED = readBoolEnv(
  // Expo "public" env var (available in app code)
  process.env.EXPO_PUBLIC_UNLIMITED_HINTS
);

