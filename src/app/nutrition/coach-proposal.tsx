import { Stack } from 'expo-router';

import NutritionTargetProposalScreen from '@/features/coach/screens/NutritionTargetProposalScreen';

export default function NutritionTargetProposalRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <NutritionTargetProposalScreen />
    </>
  );
}
