import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';
import type { WorkoutSet } from '@/context/AppContext';

type WorkoutSessionSetHistoryProps = {
  onDeleteSet: (setId: string) => void;
  onEditSet: (set: WorkoutSet) => void;
  sets: WorkoutSet[];
};

export function WorkoutSessionSetHistory({ onDeleteSet, onEditSet, sets }: WorkoutSessionSetHistoryProps) {
  return (
    <AppCard>
      <Text selectable style={styles.sectionTitle}>
        Added sets
      </Text>
      {sets.length === 0 ? (
        <Text selectable style={styles.emptyText}>
          No sets added yet.
        </Text>
      ) : (
        <View style={styles.setList}>
          {sets.map((set, index) => (
            <AppCard key={set.id}>
              <View style={styles.setCard}>
                <View style={styles.setCardCopy}>
                  <Text selectable style={styles.setName}>
                    Set {index + 1} · {set.exerciseName}
                  </Text>
                  <Text selectable style={styles.setMeta}>
                    {set.weight} kg x {set.reps}
                  </Text>
                </View>
                <View style={styles.setActions}>
                  <AppButton label="Edit" onPress={() => onEditSet(set)} variant="secondary" />
                  <AppButton label="Delete" onPress={() => onDeleteSet(set.id)} variant="secondary" />
                </View>
              </View>
            </AppCard>
          ))}
        </View>
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  emptyText: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
  setActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  setCard: {
    gap: Spacing.two,
  },
  setCardCopy: {
    gap: 2,
  },
  setList: {
    gap: Spacing.two,
  },
  setMeta: {
    color: Colors.dark.text,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
  setName: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
});
