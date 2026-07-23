import { Stack } from 'expo-router';

import UserLimitationsScreen from '@/features/coach/screens/UserLimitationsScreen';

export default function UserLimitationsRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <UserLimitationsScreen />
    </>
  );
}
