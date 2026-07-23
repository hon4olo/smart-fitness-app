import { Stack } from 'expo-router';

import UserLimitationsListScreen from '@/features/coach/screens/UserLimitationsListScreen';

export default function UserLimitationsListRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <UserLimitationsListScreen />
    </>
  );
}
