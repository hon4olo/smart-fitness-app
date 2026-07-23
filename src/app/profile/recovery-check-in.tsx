import { Stack } from 'expo-router';

import RecoveryCheckInScreen from '@/features/coach/screens/RecoveryCheckInScreen';

export default function RecoveryCheckInRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <RecoveryCheckInScreen />
    </>
  );
}
