import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TrainingProgramBuilderCard } from '@/components/workouts/TrainingProgramBuilderCard';
import { AppButton } from '@/components/ui/AppButton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { BottomTabInset, Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { createDefaultTrainingProgram, saveWorkoutProgram } from '@/lib/workouts';

export default function ProgramBuilderRoute() {
  const { exercises, workouts } = useAppContext();
  const [isExpanded, setIsExpanded] = useState(true);
  const [program, setProgram] = useState(() => createDefaultTrainingProgram(workouts));
  const insets = useSafeAreaInsets();

  const draftName = program.name.trim();
  const saveDisabled = draftName.length === 0 || program.days.length === 0;

  const draftStats = useMemo(
    () => ({
      assignedWorkouts: program.days.filter((day) => !day.restDay && Boolean(day.workoutTemplateId)).length,
      restDays: program.days.filter((day) => day.restDay).length,
    }),
    [program.days],
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + BottomTabInset + 120 }]}
        keyboardShouldPersistTaps="handled"
        style={styles.scrollView}>
        <View style={styles.container}>
          <SectionHeader subtitle="Edit a draft and save only when it is ready." title="Program Builder" />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>{draftStats.assignedWorkouts} assigned workouts</Text>
            <Text style={styles.summaryText}>{draftStats.restDays} rest days</Text>
          </View>

          <TrainingProgramBuilderCard
            exercises={exercises}
            isExpanded={isExpanded}
            onProgramChange={setProgram}
            onToggleExpanded={() => setIsExpanded((current) => !current)}
            program={program}
            workouts={workouts}
          />

          <AppButton
            disabled={saveDisabled}
            label="Save Program"
            onPress={() => {
              saveWorkoutProgram({
                ...program,
                id: program.isCustom ? program.id : `program-${Date.now()}`,
                isCustom: true,
                updatedAt: new Date().toISOString(),
              });
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    padding: Spacing.three,
  },
  screen: {
    backgroundColor: Colors.dark.background,
    flex: 1,
  },
  scrollView: {
    backgroundColor: Colors.dark.background,
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  summaryText: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
});
