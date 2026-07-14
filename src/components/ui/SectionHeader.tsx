import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';


type SectionHeaderProps = {
  title: string;
  subtitle?: string;
};

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text selectable style={styles.title}>
        {title}
      </Text>
      {subtitle ? (
        <Text selectable style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 20,
    fontWeight: '800',
  },
});
