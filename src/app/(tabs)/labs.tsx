import { Redirect } from 'expo-router';

export default function LegacyLabsRedirect() {
  return <Redirect href="/(tabs)/progress" />;
}
