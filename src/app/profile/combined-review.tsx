import { Stack } from 'expo-router';

import CombinedCoachScreen from '@/features/coach/screens/CombinedCoachScreen';

export default function CombinedCoachRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <CombinedCoachScreen />
    </>
  );
}
