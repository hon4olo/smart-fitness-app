import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';
import OnboardingClientScreen from '@/features/onboarding/OnboardingClientScreen';

export default function OnboardingRoute() {
  const [isClientReady, setIsClientReady] = useState(Platform.OS !== 'web');

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  if (!isClientReady) {
    return <View style={styles.placeholder} />;
  }

  return <OnboardingClientScreen />;
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: Colors.dark.background,
    flex: 1,
  },
});
