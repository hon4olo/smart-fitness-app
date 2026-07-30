import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  getRootErrorCopy,
  loadRootErrorCopy,
  type RootErrorCopy,
} from './rootErrorLocalization';
import { detectSystemLocale } from '@/localization';

type RootErrorFallbackProps = {
  error: Error;
  retry(): void;
};

export function RootErrorFallback({ retry }: RootErrorFallbackProps) {
  const [restarting, setRestarting] = useState(false);
  const [copy, setCopy] = useState<RootErrorCopy>(() =>
    getRootErrorCopy(detectSystemLocale()),
  );

  useEffect(() => {
    let cancelled = false;
    void loadRootErrorCopy().then((nextCopy) => {
      if (!cancelled) setCopy(nextCopy);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const restart = async () => {
    if (restarting) return;
    setRestarting(true);
    try {
      await Updates.reloadAsync();
    } catch {
      setRestarting(false);
      retry();
    }
  };

  return (
    <View accessibilityRole="alert" style={styles.screen}>
      <View style={styles.card}>
        <Text selectable style={styles.eyebrow}>{copy.eyebrow}</Text>
        <Text selectable style={styles.title}>{copy.title}</Text>
        <Text selectable style={styles.body}>{copy.body}</Text>
        <Pressable
          accessibilityLabel={copy.retry}
          accessibilityRole="button"
          disabled={restarting}
          onPress={retry}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}>
          <Text style={styles.primaryButtonText}>{copy.retry}</Text>
        </Pressable>
        <Pressable
          accessibilityLabel={copy.restart}
          accessibilityRole="button"
          disabled={restarting}
          onPress={() => void restart()}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}>
          {restarting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.secondaryButtonText}>{copy.restart}</Text>
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
    marginBottom: 20,
    marginTop: 12,
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
