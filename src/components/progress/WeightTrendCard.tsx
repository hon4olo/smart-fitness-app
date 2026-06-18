import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';

type WeightTrendCardProps = {
  children: ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  title: string;
};

export function WeightTrendCard({ children, isExpanded, onToggle, title }: WeightTrendCardProps) {
  return (
    <AppCard>
      <Pressable onPress={onToggle} style={styles.header}>
        <Text style={styles.sectionTitle}>{`${title} ${isExpanded ? '−' : '+'}`}</Text>
      </Pressable>

      {isExpanded ? <View>{children}</View> : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: Spacing.two,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
});
