/**
 * In-App Purchase Service for Budget Lines
 * Handles premium unlock purchase and restore using react-native-iap
 */

import { Platform } from 'react-native';
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  finishTransaction,
  getAvailablePurchases,
  purchaseUpdatedListener,
  purchaseErrorListener,
  type Purchase,
  type PurchaseError,
  type ProductOrSubscription,
} from 'react-native-iap';
import { PremiumStatus } from '../core/types';
import { savePremiumStatus, loadPremiumStatus } from '../utils/storage';

// Product IDs - must match App Store Connect and Google Play Console
export const PRODUCT_IDS = {
  PREMIUM_UNLOCK: 'premium_unlock',
};

const productIds = Platform.select({
  ios: [PRODUCT_IDS.PREMIUM_UNLOCK],
  android: [PRODUCT_IDS.PREMIUM_UNLOCK],
  default: [],
});

// Store listeners for cleanup
let purchaseUpdateSubscription: ReturnType<typeof purchaseUpdatedListener> | null = null;
let purchaseErrorSubscription: ReturnType<typeof purchaseErrorListener> | null = null;

// Callback for purchase completion
type PurchaseCallback = (status: PremiumStatus) => void;
let onPurchaseComplete: PurchaseCallback | null = null;

/**
 * Initialize the IAP connection
 * Call this when the app starts
 */
export async function initializeIAP(): Promise<boolean> {
  try {
    const result = await initConnection();
    console.log('IAP connection initialized:', result);
    
    // Set up purchase listeners
    setupPurchaseListeners();
    
    return true;
  } catch (error) {
    console.error('Failed to initialize IAP:', error);
    return false;
  }
}

/**
 * End the IAP connection
 * Call this when the app is closing
 */
export async function terminateIAP(): Promise<void> {
  try {
    // Remove listeners
    if (purchaseUpdateSubscription) {
      purchaseUpdateSubscription.remove();
      purchaseUpdateSubscription = null;
    }
    if (purchaseErrorSubscription) {
      purchaseErrorSubscription.remove();
      purchaseErrorSubscription = null;
    }
    
    await endConnection();
    console.log('IAP connection terminated');
  } catch (error) {
    console.error('Failed to terminate IAP:', error);
  }
}

/**
 * Set up listeners for purchase events
 */
function setupPurchaseListeners(): void {
  purchaseUpdateSubscription = purchaseUpdatedListener(
    async (purchase: Purchase) => {
      console.log('Purchase updated:', purchase);
      
      // Check if purchase has a valid transaction
      if (purchase.transactionId) {
        // Process the purchase
        await processPurchase(purchase);
        
        // Finish the transaction
        try {
          await finishTransaction({ purchase, isConsumable: false });
          console.log('Transaction finished');
        } catch (error) {
          console.error('Failed to finish transaction:', error);
        }
      }
    }
  );
  
  purchaseErrorSubscription = purchaseErrorListener(
    (error: PurchaseError) => {
      console.error('Purchase error:', error);
    }
  );
}

/**
 * Process a successful purchase
 */
async function processPurchase(purchase: Purchase): Promise<void> {
  const premiumStatus: PremiumStatus = {
    isPremium: true,
    purchaseDate: new Date().toISOString(),
    productId: purchase.productId,
  };
  
  // Save premium status
  await savePremiumStatus(premiumStatus);
  
  // Notify callback if set
  if (onPurchaseComplete) {
    onPurchaseComplete(premiumStatus);
  }
}

/**
 * Get available products with prices
 */
export async function getAvailableProducts(): Promise<ProductOrSubscription[]> {
  try {
    if (!productIds || productIds.length === 0) {
      console.warn('No product IDs configured for this platform');
      return [];
    }
    
    const products = await fetchProducts({ skus: productIds });
    console.log('Available products:', products);
    return products ?? [];
  } catch (error) {
    console.error('Failed to get products:', error);
    return [];
  }
}

/**
 * Get the formatted price for the premium product
 */
export async function getPremiumPrice(): Promise<string> {
  try {
    const products = await getAvailableProducts();
    const premiumProduct = products.find(p => {
      // Handle both iOS and Android product structures
      if ('productId' in p) {
        return p.productId === PRODUCT_IDS.PREMIUM_UNLOCK;
      }
      return false;
    });
    
    if (premiumProduct && 'localizedPrice' in premiumProduct) {
      return String(premiumProduct.localizedPrice);
    }
    
    // Fallback price if product not found
    return '$3.99';
  } catch (error) {
    console.error('Failed to get premium price:', error);
    return '$3.99';
  }
}

/**
 * Purchase the premium unlock
 */
export async function purchasePremium(
  onComplete: PurchaseCallback
): Promise<boolean> {
  try {
    // Store callback for when purchase completes
    onPurchaseComplete = onComplete;
    
    // Request the purchase with the new API format
    await requestPurchase({
      request: {
        apple: {
          sku: PRODUCT_IDS.PREMIUM_UNLOCK,
          andDangerouslyFinishTransactionAutomatically: false,
        },
        google: {
          skus: [PRODUCT_IDS.PREMIUM_UNLOCK],
        },
      },
      type: 'in-app',
    });
    
    return true;
  } catch (error) {
    console.error('Failed to purchase premium:', error);
    onPurchaseComplete = null;
    return false;
  }
}

/**
 * Restore previous purchases
 * Returns the premium status if a valid purchase is found
 */
export async function restorePurchases(): Promise<PremiumStatus | null> {
  try {
    const purchases = await getAvailablePurchases();
    console.log('Available purchases:', purchases);
    
    if (!purchases) {
      return null;
    }
    
    // Look for premium unlock in purchase history
    const premiumPurchase = purchases.find(
      (p: Purchase) => p.productId === PRODUCT_IDS.PREMIUM_UNLOCK
    );
    
    if (premiumPurchase) {
      const premiumStatus: PremiumStatus = {
        isPremium: true,
        purchaseDate: premiumPurchase.transactionDate
          ? new Date(Number(premiumPurchase.transactionDate)).toISOString()
          : new Date().toISOString(),
        productId: premiumPurchase.productId,
      };
      
      // Save restored status
      await savePremiumStatus(premiumStatus);
      
      // Finish any pending transactions
      for (const purchase of purchases) {
        try {
          await finishTransaction({ purchase, isConsumable: false });
        } catch (e) {
          // Ignore errors for already finished transactions
        }
      }
      
      return premiumStatus;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to restore purchases:', error);
    return null;
  }
}

/**
 * Check if user has premium (from local storage)
 * This is a quick check that doesn't hit the store
 */
export async function checkPremiumStatus(): Promise<PremiumStatus | null> {
  return await loadPremiumStatus();
}
