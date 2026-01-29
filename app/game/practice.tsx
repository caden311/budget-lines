/**
 * Practice puzzle game screen
 */

import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import { useUserStore } from '../../src/stores/userStore';
import { GameScreen } from '../../src/screens/GameScreen';

export default function PracticeGameScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { preferredDifficulty } = useUserStore();
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton}
          onPress={() => router.replace('/practice')}
        >
          <Text style={[styles.backButtonText, { color: theme.success }]}>← Back</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Practice Mode</Text>
        <View style={styles.placeholder} />
      </View>
      <GameScreen mode="practice" difficulty={preferredDifficulty} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 60,
  },
});
