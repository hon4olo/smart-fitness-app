import { Redirect } from 'expo-router';

export default function LegacyEatRedirect() {
  return <Redirect href="/(tabs)/nutrition" />;
}
