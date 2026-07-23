import { Stack } from 'expo-router';

import SafetyRecoveryPreflightScreen from '@/features/coach/screens/SafetyRecoveryPreflightScreen';

export default function SafetyRecoveryPreflightRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafetyRecoveryPreflightScreen />
    </>
  );
}
