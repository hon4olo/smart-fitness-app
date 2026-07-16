import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TrainingProgramBuilderCard } from '@/components/workouts/TrainingProgramBuilderCard';
import { AppButton } from '@/components/ui/AppButton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { BottomTabInset, Colors, MaxContentWidth, Radii, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { createDefaultTrainingProgram, saveWorkoutProgram } from '@/lib/workouts';
import { useAppTheme } from '@/theme/AppThemeProvider';

export default function ProgramBuilderRoute() {
  const { exercises, workouts } = useAppContext();
  const { colors } = useAppTheme();
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
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + BottomTabInset + 160 }]}
        keyboardShouldPersistTaps="handled"
        style={[styles.scrollView, { backgroundColor: colors.background }]}>
        <View style={styles.container}>
          <SectionHeader subtitle="Edit a draft and save only when it is ready." title="Program Builder" />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryText, { color: colors.textSecondary }]}>{draftStats.assignedWorkouts} assigned workouts</Text>
            <Text style={[styles.summaryText, { color: colors.textSecondary }]}>{draftStats.restDays} rest days</Text>
          </View>

          <TrainingProgramBuilderCard
            exercises={exercises}
            isExpanded={isExpanded}
            onProgramChange={setProgram}
            onToggleExpanded={() => setIsExpanded((current) => !current)}
            program={program}
            workouts={workouts}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.borderSubtle, paddingBottom: insets.bottom + Spacing.two }]}>
        <View style={styles.container}>
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
      </View>
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
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    left: 0,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    position: 'absolute',
    right: 0,
    top: 'auto',
    bottom: 0,
  },
  screen: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
