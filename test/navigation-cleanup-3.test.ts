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
    expect(count(source, 'tabBarIcon: ({ focused }) => <TabIcon focused={focused}')).toBe(5);
    expect(count(source, 'href: null')).toBe(4);
    expect(source).toContain("title: 'Home'");
    expect(source).toContain("title: 'Workouts'");
    expect(source).toContain("title: 'Nutrition'");
    expect(source).toContain("title: 'Progress'");
    expect(source).toContain("title: 'Profile'");
    expect(source).toContain("name=\"coach\"");
    expect(source).toContain("name=\"labs\"");
    expect(source).toContain("name=\"track\"");
    expect(source).toContain("name=\"eat\"");
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

    expect(source).toContain('Start now');
    expect(source).toContain('Programs');
    expect(source).toContain('Create program');
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

  test('profile renders compact appearance and quiet developer settings', () => {
    const screen = readSource('src/app/(tabs)/profile.tsx');
    const preferences = readSource('src/components/profile/ProfilePreferencesCard.tsx');
    const sync = readSource('src/components/profile/ProfileSyncStatusCard.tsx');
    const developer = readSource('src/components/profile/ProfileActionsCard.tsx');

    expect(screen).toContain('Account');
    expect(screen).toContain('Goals');
    expect(screen).toContain('Preferences');
    expect(screen).toContain('Sync & Backup');
    expect(screen).toContain('Developer settings');
    expect(preferences).toContain('Appearance');
    expect(preferences).toContain('SegmentedControl');
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
    const syncBackup = readSource('src/app/sync-backup.tsx');
    const weightEntry = readSource('src/app/weight-entry.tsx');

    expect(workouts).toContain('Create program');
    expect(template).toContain('Start workout');
    expect(program).toContain('Edit program');
    expect(progress).toContain("router.push('/weight-entry')");
    expect(profile).toContain('ProfileSyncStatusCard');
    expect(syncBackup).toContain("syncNow()");
    expect(weightEntry).toContain("addWeightEntry({");
  });
});
