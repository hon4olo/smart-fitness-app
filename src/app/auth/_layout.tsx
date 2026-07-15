import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: '#090B0F' },
        headerShown: false,
      }}
    />
  );
}
