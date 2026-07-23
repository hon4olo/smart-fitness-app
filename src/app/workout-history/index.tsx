import { Stack } from 'expo-router';

import WorkoutHistoryScreen from '@/features/workouts/screens/WorkoutHistoryScreen';

export default function WorkoutHistoryRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <WorkoutHistoryScreen />
    </>
  );
}
