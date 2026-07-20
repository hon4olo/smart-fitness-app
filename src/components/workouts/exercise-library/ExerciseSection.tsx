import { Text, View } from 'react-native';

import type { Exercise } from '@/types';

import { ExerciseRow } from './ExerciseRow';

type ExerciseSectionProps = {
  exercises: Exercise[];
  favoriteIdSet: Set<string>;
  isExerciseAdded: (name: string) => boolean;
  onAdd: (name: string) => void;
  onDelete: (exerciseId: string) => void;
  onOpenDetail: (exerciseId: string) => void;
  onToggleFavorite: (exerciseId: string) => void;
  query: string;
  sectionLabel: string;
  styles: Record<string, any>;
  title: string;
};

export function ExerciseSection({ exercises, favoriteIdSet, isExerciseAdded, onAdd, onDelete, onOpenDetail, onToggleFavorite, query, sectionLabel, styles, title }: ExerciseSectionProps) {
  if (exercises.length === 0) {
    return null;
  }

  return (
    <View style={styles.sectionBlock}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeading}>{title}</Text>
        <Text style={styles.sectionCount}>{exercises.length}</Text>
      </View>
      <View style={styles.sectionList}>
        {exercises.map((exercise) => (
          <ExerciseRow
            key={exercise.id}
            exercise={exercise}
            isAdded={isExerciseAdded(exercise.name)}
            isFavorite={favoriteIdSet.has(exercise.id)}
            onAdd={onAdd}
            onDelete={onDelete}
            onOpenDetail={onOpenDetail}
            onToggleFavorite={onToggleFavorite}
            query={query}
            sectionLabel={sectionLabel}
            styles={styles}
          />
        ))}
      </View>
    </View>
  );
}
