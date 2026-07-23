import { Stack } from 'expo-router';

import WorkoutHistoryDetailScreen from '@/features/workouts/screens/WorkoutHistoryDetailScreen';

export default function WorkoutHistoryDetailRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <WorkoutHistoryDetailScreen />
    </>
  );
}
