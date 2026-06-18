import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';

type WorkoutVolumeTrendCardProps = {
  children: ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  summary?: ReactNode;
  title: string;
};

export function WorkoutVolumeTrendCard({
  children,
  isExpanded,
  onToggle,
  summary,
  title,
}: WorkoutVolumeTrendCardProps) {
  return (
    <AppCard>
      <Pressable onPress={onToggle} style={styles.collapsibleHeader}>
        <Text style={styles.sectionTitle}>{`${title} ${isExpanded ? '−' : '+'}`}</Text>
      </Pressable>

      {isExpanded ? (
        <>
          {children}
          {summary ? <View style={styles.summary}>{summary}</View> : null}
        </>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  collapsibleHeader: {
    paddingBottom: Spacing.two,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
  summary: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
});