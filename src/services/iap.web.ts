/**
 * In-App Purchase Service for SumTrails - Web Stub
 * IAP is not available on web - provides no-op implementations
 */

import { PremiumStatus } from '../core/types';
import { loadPremiumStatus } from '../utils/storage';

// Product IDs - exported for compatibility
export const PRODUCT_IDS = {
  PREMIUM_UNLOCK: 'premium_unlock',
};

// Callback type for purchase completion
type PurchaseCallback = (status: PremiumStatus) => void;

/**
 * Initialize the IAP connection
 * No-op on web - IAP not available
 */
export async function initializeIAP(): Promise<boolean> {
  console.log('[IAP] Web platform - IAP not available');
  return false;
}

/**
 * End the IAP connection
 * No-op on web
 */
export async function terminateIAP(): Promise<void> {
  // No-op on web
}

/**
 * Get available products with prices
 * Returns empty array on web
 */
export async function getAvailableProducts(): Promise<never[]> {
  console.log('[IAP] Web platform - no products available');
  return [];
}

/**
 * Get the formatted price for the premium product
 * Returns fallback price on web
 */
export async function getPremiumPrice(): Promise<string> {
  return '$3.99';
}

/**
 * Purchase the premium unlock
 * Not available on web
 */
export async function purchasePremium(
  _onComplete: PurchaseCallback
): Promise<boolean> {
  console.warn('[IAP] Purchases not available on web platform');
  return false;
}

/**
 * Restore previous purchases
 * Not available on web
 */
export async function restorePurchases(): Promise<PremiumStatus | null> {
  console.warn('[IAP] Restore purchases not available on web platform');
  return null;
}

/**
 * Check if user has premium (from local storage)
 * This still works on web as it just checks storage
 */
export async function checkPremiumStatus(): Promise<PremiumStatus | null> {
  return await loadPremiumStatus();
}
