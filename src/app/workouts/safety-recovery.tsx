import { Stack } from 'expo-router';

import SafetyRecoveryScreen from '@/features/coach/screens/SafetyRecoveryScreen';

export default function SafetyRecoveryRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafetyRecoveryScreen />
    </>
  );
}
