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
import { GameState } from '../core/types';
import { generateShareText, formatTime, generateEmojiGrid } from '../utils/sharing';

interface GameModalProps {
  visible: boolean;
  type: 'win' | 'stuck';
  gameState: GameState | null;
  onClose: () => void;
  onReset: () => void;
  onNewPuzzle?: () => void;
}

export function GameModal({
  visible,
  type,
  gameState,
  onClose,
  onReset,
  onNewPuzzle,
}: GameModalProps) {
  if (!gameState) return null;
  
  const isWin = type === 'win';
  const timeMs = gameState.completedAt && gameState.startedAt
    ? gameState.completedAt - gameState.startedAt
    : 0;
  
  const handleShare = async () => {
    const shareText = generateShareText(gameState);
    
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
  
  const handleCopy = async () => {
    const shareText = generateShareText(gameState);
    await Clipboard.setStringAsync(shareText);
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.emoji}>
              {isWin ? '🎉' : '😅'}
            </Text>
            <Text style={styles.title}>
              {isWin ? 'Puzzle Complete!' : 'No Moves Left'}
            </Text>
            <Text style={styles.subtitle}>
              {isWin 
                ? `${gameState.lines.length} lines in ${formatTime(timeMs)}`
                : 'Try resetting and finding a new path'
              }
            </Text>
          </View>
          
          {/* Emoji grid preview */}
          {isWin && (
            <View style={styles.gridPreview}>
              <Text style={styles.emojiGrid}>
                {generateEmojiGrid(gameState)}
              </Text>
            </View>
          )}
          
          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{gameState.lines.length}</Text>
              <Text style={styles.statLabel}>Lines</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatTime(timeMs)}</Text>
              <Text style={styles.statLabel}>Time</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{gameState.targetSum}</Text>
              <Text style={styles.statLabel}>Target</Text>
            </View>
          </View>
          
          {/* Actions */}
          <View style={styles.actions}>
            {isWin && (
              <Pressable
                style={[styles.button, styles.primaryButton]}
                onPress={handleShare}
              >
                <Text style={styles.primaryButtonText}>Share Results</Text>
              </Pressable>
            )}
            
            <Pressable
              style={[styles.button, styles.secondaryButton]}
              onPress={onReset}
            >
              <Text style={styles.secondaryButtonText}>
                {isWin ? 'Play Again' : 'Reset Puzzle'}
              </Text>
            </Pressable>
            
            {onNewPuzzle && (
              <Pressable
                style={[styles.button, styles.tertiaryButton]}
                onPress={onNewPuzzle}
              >
                <Text style={styles.tertiaryButtonText}>New Puzzle</Text>
              </Pressable>
            )}
            
            <Pressable
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>Close</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: '#1e1e3a',
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
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#94a3b8',
    marginTop: 6,
    textAlign: 'center',
  },
  gridPreview: {
    backgroundColor: '#16162a',
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
    borderColor: '#2d2d44',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
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
  primaryButton: {
    backgroundColor: '#a855f7',
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  secondaryButton: {
    backgroundColor: '#2d2d44',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3d3d5c',
  },
  tertiaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
  },
  closeButton: {
    paddingVertical: 12,
  },
  closeButtonText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
  },
});
