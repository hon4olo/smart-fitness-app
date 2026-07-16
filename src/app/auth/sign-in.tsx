import { useRouter } from 'expo-router';

import { AuthFormScreen } from '@/components/auth';
import { useAuthSession } from '@/hooks/useAuthSession';

export default function SignInScreen() {
  const router = useRouter();
  const { login } = useAuthSession();

  return (
    <AuthFormScreen
      mode="login"
      onBack={() => router.back()}
      onSubmit={async (values) => {
        await login({ email: values.email, password: values.password });
        router.replace('/(tabs)/profile');
      }}
      onSwitchMode={() => router.push('/auth/register')}
    />
  );
}
