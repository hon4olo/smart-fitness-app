import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppTheme } from '@/theme/AppThemeProvider';

export default function DirectExerciseGifTestRoute() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + Spacing.three }]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.headerControl}>
            <Text style={styles.headerControlText}>Back</Text>
          </Pressable>
          <Text style={styles.title}>Direct physical-device GIF test</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.message}>GIF test disabled in this runtime. Requires a new native build with bumped runtimeVersion.</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.surfacePrimary,
    borderColor: Colors.dark.borderSubtle,
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
  },
  container: {
    gap: Spacing.four,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
  },
  headerControl: {
    alignItems: 'center',
    borderColor: Colors.dark.borderSubtle,
    borderRadius: Radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 40,
    minWidth: 64,
    paddingHorizontal: Spacing.three,
  },
  headerControlText: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.label.fontSize,
    fontWeight: Typography.label.fontWeight,
  },
  message: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.callout.fontSize,
    fontWeight: '700',
    lineHeight: Typography.callout.lineHeight,
    textAlign: 'center',
  },
  screen: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  title: {
    color: Colors.dark.textPrimary,
    flex: 1,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.cardTitle.fontWeight,
    lineHeight: Typography.cardTitle.lineHeight,
    textAlign: 'center',
  },
});
