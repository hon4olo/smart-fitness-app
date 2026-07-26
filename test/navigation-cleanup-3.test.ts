import { describe, expect, test } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as { readFileSync: (path: string, encoding: string) => string };
const { resolve } = require('path') as { resolve: (...parts: string[]) => string };

const projectRoot = resolve(__dirname, '..');
const readSource = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), 'utf8');
const count = (source: string, needle: string) => (source.match(new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length;

describe('navigation repair and UX cleanup 3.0', () => {
  test('tab layout exposes exactly five public tabs and hides internal routes', () => {
    const source = readSource('src/app/(tabs)/_layout.tsx');

    expect(count(source, '<Tabs.Screen')).toBe(9);
    expect(count(source, '<TabIcon focused={focused} name=')).toBe(5);
    expect(count(source, 'href: null')).toBe(4);
    expect(source).toContain("title: t('tabs.home')");
    expect(source).toContain("title: t('tabs.workouts')");
    expect(source).toContain("title: t('tabs.nutrition')");
    expect(source).toContain("title: t('tabs.progress')");
    expect(source).toContain("title: t('tabs.profile')");
    expect(source).toContain('name="coach"');
    expect(source).toContain('name="labs"');
    expect(source).toContain('name="track"');
    expect(source).toContain('name="eat"');
  });

  test('home keeps a single current-weight display and no dashboard duplicate cards', () => {
    const source = readSource('src/app/(tabs)/index.tsx');

    expect(source).not.toContain('latestWorkoutLabel');
    expect(source).not.toContain('HomeActivityCard');
    expect(source).not.toContain('HomeIntelligenceCard');
    expect(source).not.toContain('Today’s essentials');
    expect(source).toContain('HomeSummaryCard');
    expect(source).toContain('QuickActionsCard');
    expect(source).toContain('HomeSnapshotCard');
  });

  test('workouts keeps one start-now action and one program creation action', () => {
    const source = readSource('src/features/workouts/screens/WorkoutsScreen.tsx');

    expect(source).toContain('Start Now');
    expect(source).toContain('Programs');
    expect(source).toContain('Add new program');
    expect(source).toContain('icon="add"');
    expect(source).toContain('CreateProgramModal');
    expect(source).not.toContain('addProgramActionLabel');
    expect(source).not.toContain('Start empty workout');
    expect(source).not.toContain('Add Program');
    expect(source).not.toContain('Recommendation');
  });

  test('progress moves add-weight into a dedicated flow and keeps the summary compact', () => {
    const source = readSource('src/app/(tabs)/progress.tsx');

    expect(source).not.toContain('AddWeightEntryCard');
    expect(source).not.toContain('isWeightDisabled');
    expect(source).toContain("router.push('/weight-entry')");
    expect(count(source, 'Weight details')).toBe(1);
    expect(source).not.toContain('latest readings only');
    expect(source).toContain('Add weight');
  });

  test('Profile stays concise while Settings and Progress own editing', () => {
    const screen = readSource('src/app/(tabs)/profile.tsx');
    const progress = readSource('src/app/(tabs)/progress.tsx');
    const planning = readSource('src/features/progress/ProgressPlanningSections.tsx');
    const preferences = readSource('src/components/profile/ProfilePreferencesCard.tsx');
    const settings = readSource('src/app/settings/index.tsx');
    const sync = readSource('src/components/profile/ProfileSyncStatusCard.tsx');
    const developer = readSource('src/components/profile/ProfileActionsCard.tsx');

    expect(screen).toContain('ProfilePreferencesCard');
    expect(screen).toContain("router.push('/settings')");
    expect(screen).not.toContain('AuthGateCard');
    expect(screen).not.toContain('ProfileGoalsCard');
    expect(screen).not.toContain('ProfileCoachCard');
    expect(screen).not.toContain('ProfileSyncStatusCard');
    expect(screen).not.toContain('ProfileRuntimeInfoCard');
    expect(screen).not.toContain('ProfileActionsCard');
    expect(progress).toContain('<ProgressPlanningSections />');
    expect(planning).toContain('ProfileGoalsCard');
    expect(planning).toContain('ProfileCoachCard');
    expect(preferences).not.toContain('SegmentedControl');
    expect(settings).toContain('<AuthGateCard />');
    expect(settings).toContain('<PersonalDetailsSettingsCard />');
    expect(settings).toContain('settings.appearance');
    expect(settings).toContain('settings.language');
    expect(settings).toContain('SegmentedControl');
    expect(settings).toContain('<SyncSettingsCard />');
    expect(settings).toContain('<ProfileActionsCard');
    expect(settings).toContain('<ProfileRuntimeInfoCard');
    expect(settings).toContain('developerExpanded');
    expect(sync).toContain("router.push('/sync-backup')");
    expect(sync).toContain('Last sync');
    expect(developer).not.toContain('owner-only');
    expect(developer).toContain('Developer');
  });

  test('business actions remain reachable through public and secondary routes', () => {
    const workouts = readSource('src/features/workouts/screens/WorkoutsScreen.tsx');
    const template = readSource('src/features/workouts/screens/WorkoutTemplateDetailScreen.tsx');
    const program = readSource('src/features/workouts/screens/ProgramDetailScreen.tsx');
    const progress = readSource('src/app/(tabs)/progress.tsx');
    const profile = readSource('src/app/(tabs)/profile.tsx');
    const settings = readSource('src/app/settings/index.tsx');
    const syncBackup = readSource('src/app/sync-backup.tsx');
    const weightEntry = readSource('src/app/weight-entry.tsx');

    expect(workouts).toContain('Add new program');
    expect(template).toContain('Start Workout');
    expect(program).toContain('Add routine to program');
    expect(progress).toContain("router.push('/weight-entry')");
    expect(profile).toContain("router.push('/settings')");
    expect(settings).toContain('<SyncSettingsCard />');
    expect(syncBackup).toContain('syncNow()');
    expect(weightEntry).toContain('addWeightEntry({');
  });
});
