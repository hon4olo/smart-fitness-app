import { useRouter } from 'expo-router';

import { AuthFormScreen } from '@/components/auth';
import { useAuthSession } from '@/hooks/useAuthSession';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuthSession();

  return (
    <AuthFormScreen
      mode="register"
      onSubmit={async (values) => {
        const registerValues = values as { email: string; password: string; displayName?: string };
        await register({
          email: registerValues.email,
          password: registerValues.password,
          displayName: registerValues.displayName?.trim() || undefined,
        });
        router.replace('/(tabs)/profile');
      }}
      onSwitchMode={() => router.push('/auth/sign-in')}
    />
  );
}
