import { Stack } from 'expo-router';

import SafetyRecoveryCoachScreen from '@/features/coach/screens/SafetyRecoveryCoachScreen';

export default function SafetyRecoveryCoachRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafetyRecoveryCoachScreen />
    </>
  );
}
