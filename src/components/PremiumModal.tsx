/**
 * Premium upgrade modal
 * Shows benefits and purchase button with real IAP integration
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../theme';
import { useUserStore } from '../stores/userStore';
import { purchasePremium, restorePurchases, getPremiumPrice } from '../services/iap';
import { trackPremiumModalView, trackPremiumPurchase } from '../services/analytics';

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
  feature?: 'practice' | 'stats' | 'hints';
}

const FEATURE_MESSAGES: Record<string, { title: string; subtitle: string }> = {
  practice: {
    title: 'Unlock Practice Mode',
    subtitle: 'Play unlimited puzzles at any difficulty',
  },
  stats: {
    title: 'Unlock Detailed Stats',
    subtitle: 'Track your best times and performance trends',
  },
  hints: {
    title: 'Unlock Hints',
    subtitle: 'Get help when you\'re stuck on a puzzle',
  },
  default: {
    title: 'Go Premium',
    subtitle: 'Unlock all features with a one-time purchase',
  },
};

const PREMIUM_BENEFITS = [
  { emoji: '🎮', text: 'Unlimited practice puzzles' },
  { emoji: '📊', text: 'Detailed performance stats' },
  { emoji: '💡', text: 'Hints when you\'re stuck' },
  { emoji: '🎨', text: 'Premium themes' },
  { emoji: '🚫', text: 'No ads, ever' },
];

export function PremiumModal({ visible, onClose, feature }: PremiumModalProps) {
  const { theme } = useTheme();
  const { setPremiumStatus } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [price, setPrice] = useState('$3.99');
  
  const message = feature ? FEATURE_MESSAGES[feature] : FEATURE_MESSAGES.default;
  
  // Track modal view and fetch price when visible
  useEffect(() => {
    if (visible) {
      trackPremiumModalView(feature || 'default');
      
      // Fetch real price from store
      getPremiumPrice().then(setPrice).catch(() => {
        // Keep fallback price
      });
    }
  }, [visible, feature]);
  
  const handlePurchase = async () => {
    setIsLoading(true);
    
    try {
      const success = await purchasePremium(async (status) => {
        // Purchase completed successfully
        await setPremiumStatus(status);
        trackPremiumPurchase(status.productId || 'premium_unlock');
        setIsLoading(false);
        onClose();
      });
      
      if (!success) {
        setIsLoading(false);
        Alert.alert(
          'Purchase Failed',
          'Unable to complete the purchase. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Purchase error:', error);
      Alert.alert(
        'Purchase Error',
        'An error occurred during the purchase. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };
  
  const handleRestore = async () => {
    setIsRestoring(true);
    
    try {
      const status = await restorePurchases();
      
      if (status) {
        await setPremiumStatus(status);
        Alert.alert(
          'Purchase Restored',
          'Your premium purchase has been restored!',
          [{ text: 'OK', onPress: onClose }]
        );
      } else {
        Alert.alert(
          'No Purchase Found',
          'We couldn\'t find any previous purchases to restore.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert(
        'Restore Failed',
        'Unable to restore purchases. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsRestoring(false);
    }
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: theme.cardBackground }]}>
          {/* Close button */}
          <Pressable 
            style={styles.closeButton} 
            onPress={onClose}
            disabled={isLoading || isRestoring}
          >
            <Text style={[styles.closeText, { color: theme.textMuted }]}>✕</Text>
          </Pressable>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.crown}>👑</Text>
            <Text style={[styles.title, { color: theme.text }]}>{message.title}</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>{message.subtitle}</Text>
          </View>
          
          {/* Benefits list */}
          <View style={styles.benefits}>
            {PREMIUM_BENEFITS.map((benefit, index) => (
              <View key={index} style={styles.benefitRow}>
                <Text style={styles.benefitEmoji}>{benefit.emoji}</Text>
                <Text style={[styles.benefitText, { color: theme.textSecondary }]}>
                  {benefit.text}
                </Text>
              </View>
            ))}
          </View>
          
          {/* Price badge */}
          <View style={[styles.priceBadge, { backgroundColor: theme.backgroundTertiary }]}>
            <Text style={[styles.priceLabel, { color: theme.textMuted }]}>One-time purchase</Text>
            <Text style={[styles.price, { color: theme.text }]}>{price}</Text>
          </View>
          
          {/* Purchase button */}
          <Pressable
            style={({ pressed }) => [
              styles.purchaseButton,
              { backgroundColor: pressed ? theme.primaryDark : theme.primary },
              pressed && styles.purchaseButtonPressed,
              (isLoading || isRestoring) && styles.buttonDisabled,
            ]}
            onPress={handlePurchase}
            disabled={isLoading || isRestoring}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.purchaseButtonText}>Unlock Premium</Text>
            )}
          </Pressable>
          
          {/* Restore purchases */}
          <Pressable 
            style={styles.restoreButton} 
            onPress={handleRestore}
            disabled={isLoading || isRestoring}
          >
            {isRestoring ? (
              <ActivityIndicator color={theme.textMuted} size="small" />
            ) : (
              <Text style={[styles.restoreText, { color: theme.textMuted }]}>
                Restore Purchase
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeText: {
    fontSize: 20,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  crown: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  benefits: {
    marginBottom: 24,
    gap: 14,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  benefitEmoji: {
    fontSize: 22,
    width: 32,
    textAlign: 'center',
  },
  benefitText: {
    fontSize: 16,
    flex: 1,
  },
  priceBadge: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
  },
  purchaseButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 56,
    justifyContent: 'center',
  },
  purchaseButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 8,
    minHeight: 32,
    justifyContent: 'center',
  },
  restoreText: {
    fontSize: 14,
  },
});
