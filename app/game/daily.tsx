/**
 * Daily puzzle game screen
 */

import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GameScreen } from '../../src/screens/GameScreen';
import { useTheme } from '../../src/theme';

export default function DailyGameScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton}
          onPress={() => router.replace('/')}
        >
          <Text style={[styles.backButtonText, { color: theme.primary }]}>← Back</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Daily Puzzle</Text>
        <View style={styles.placeholder} />
      </View>
      <GameScreen mode="daily" />
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
