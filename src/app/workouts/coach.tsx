import { Stack } from 'expo-router';

import StrengthCoachScreen from '@/features/coach/screens/StrengthCoachScreen';

export default function StrengthCoachRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StrengthCoachScreen />
    </>
  );
}
