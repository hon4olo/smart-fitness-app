import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';

type ProgressSectionCardProps = {
  actions?: ReactNode;
  children: ReactNode;
  emptyState?: ReactNode;
  subtitle?: string;
  title: string;
};

export function ProgressSectionCard({ actions, children, emptyState, subtitle, title }: ProgressSectionCardProps) {
  return (
    <AppCard>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text selectable style={styles.title}>
            {title}
          </Text>
          {subtitle ? <Text selectable style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {actions ? <View style={styles.actions}>{actions}</View> : null}
      </View>

      {children}
      {emptyState ? <View style={styles.emptyState}>{emptyState}</View> : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignItems: 'flex-end',
  },
  emptyState: {
    marginTop: Spacing.two,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    gap: Spacing.one,
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
});
