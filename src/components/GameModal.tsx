/**
 * Game modal component for Budget Lines
 * Shows win/stuck states with sharing options
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Share,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { GameState, GameMode } from '../core/types';
import { generateShareText, formatTime, generateEmojiGrid } from '../utils/sharing';
import { useTheme } from '../theme';
import { trackShareResults } from '../services/analytics';

interface GameModalProps {
  visible: boolean;
  type: 'win' | 'stuck';
  gameState: GameState | null;
  gameMode?: GameMode;
  onClose: () => void;
  onReset: () => void;
  onNewPuzzle?: () => void;
}

export function GameModal({
  visible,
  type,
  gameState,
  gameMode = 'daily',
  onClose,
  onReset,
  onNewPuzzle,
}: GameModalProps) {
  const { theme, isDark } = useTheme();
  
  if (!gameState) return null;
  
  const isWin = type === 'win';
  
  // Calculate elapsed time
  // Use current time if completedAt not set yet (modal might render before state updates)
  const endTime = gameState.completedAt || Date.now();
  const startTime = gameState.startedAt || 0;
  const timeMs = startTime > 0 ? endTime - startTime : 0;
  
  const handleShare = async () => {
    const shareText = generateShareText(gameState);
    
    // Track share event
    trackShareResults(gameMode, gameState.lines.length);
    
    if (Platform.OS === 'web') {
      await Clipboard.setStringAsync(shareText);
      alert('Copied to clipboard!');
    } else {
      try {
        await Share.share({
          message: shareText,
        });
      } catch (error) {
        console.error('Share error:', error);
      }
    }
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: theme.cardBackground }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.emoji}>
              {isWin ? '🎉' : '😅'}
            </Text>
            <Text style={[styles.title, { color: theme.text }]}>
              {isWin ? 'Puzzle Complete!' : 'No Moves Left'}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {isWin 
                ? `${gameState.lines.length} lines in ${formatTime(timeMs)}`
                : 'Try resetting and finding a new path'
              }
            </Text>
          </View>
          
          {/* Emoji grid preview */}
          {isWin && (
            <View style={[styles.gridPreview, { backgroundColor: theme.backgroundSecondary }]}>
              <Text style={styles.emojiGrid}>
                {generateEmojiGrid(gameState)}
              </Text>
            </View>
          )}
          
          {/* Stats */}
          <View style={[styles.stats, { borderColor: theme.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>{gameState.lines.length}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Lines</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>{formatTime(timeMs)}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Time</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>{gameState.targetSum}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Target</Text>
            </View>
          </View>
          
          {/* Actions */}
          <View style={styles.actions}>
            {isWin && (
              <Pressable
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={handleShare}
              >
                <Text style={styles.primaryButtonText}>Share Results</Text>
              </Pressable>
            )}
            
            <Pressable
              style={[styles.button, { backgroundColor: theme.buttonSecondary }]}
              onPress={onReset}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
                {isWin ? 'Play Again' : 'Reset Puzzle'}
              </Text>
            </Pressable>
            
            {onNewPuzzle && (
              <Pressable
                style={[styles.button, styles.tertiaryButton, { borderColor: theme.border }]}
                onPress={onNewPuzzle}
              >
                <Text style={[styles.tertiaryButtonText, { color: theme.textSecondary }]}>New Puzzle</Text>
              </Pressable>
            )}
            
            <Pressable
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={[styles.closeButtonText, { color: theme.textMuted }]}>Close</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    marginTop: 6,
    textAlign: 'center',
  },
  gridPreview: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  emojiGrid: {
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    letterSpacing: 2,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  tertiaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    paddingVertical: 12,
  },
  closeButtonText: {
    fontSize: 15,
    textAlign: 'center',
  },
});
