import * as Updates from 'expo-updates';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { captureFatalError, restartApplicationAsync } from './crashReporting';
import { createSupportIdentifier } from './crashReportingModel';

type RootErrorFallbackProps = {
  error: Error;
  retry(): void;
};

export function RootErrorFallback({ error, retry }: RootErrorFallbackProps) {
  const [restarting, setRestarting] = useState(false);
  const supportId = useMemo(
    () => createSupportIdentifier(error, Updates.updateId),
    [error],
  );

  useEffect(() => {
    captureFatalError(error);
  }, [error]);

  const restart = async () => {
    if (restarting) return;
    setRestarting(true);
    const restarted = await restartApplicationAsync();
    if (!restarted) {
      setRestarting(false);
      retry();
    }
  };

  return (
    <View accessibilityRole="alert" style={styles.screen}>
      <View style={styles.card}>
        <Text selectable style={styles.eyebrow}>SMART FITNESS</Text>
        <Text selectable style={styles.title}>Something went wrong</Text>
        <Text selectable style={styles.body}>
          Your saved data has not been intentionally removed. Try reopening this screen or restart the app.
        </Text>
        <View style={styles.supportBox}>
          <Text selectable style={styles.supportLabel}>Support code</Text>
          <Text selectable style={styles.supportValue}>{supportId}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={restarting}
          onPress={retry}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}>
          <Text style={styles.primaryButtonText}>Try again</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={restarting}
          onPress={() => void restart()}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}>
          {restarting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.secondaryButtonText}>Restart app</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    backgroundColor: '#000000',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  card: {
    backgroundColor: '#111111',
    borderColor: '#282828',
    borderRadius: 24,
    borderWidth: 1,
    maxWidth: 460,
    padding: 24,
    width: '100%',
  },
  eyebrow: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginBottom: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 34,
  },
  body: {
    color: '#B0B0B5',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
  },
  supportBox: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    marginBottom: 20,
    marginTop: 20,
    padding: 14,
  },
  supportLabel: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  supportValue: {
    color: '#FFFFFF',
    fontSize: 17,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#0A84FF',
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#3A3A3C',
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 10,
    minHeight: 50,
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.72,
  },
});
