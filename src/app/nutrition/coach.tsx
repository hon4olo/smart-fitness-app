import { Stack } from 'expo-router';

import NutritionCoachScreen from '@/features/coach/screens/NutritionCoachScreen';

export default function NutritionCoachRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <NutritionCoachScreen />
    </>
  );
}