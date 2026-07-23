import { Stack } from 'expo-router';

import UserLimitationScreen from '@/features/coach/screens/UserLimitationScreen';

export default function UserLimitationRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <UserLimitationScreen />
    </>
  );
}
