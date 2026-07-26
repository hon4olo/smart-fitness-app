import { useRouter } from 'expo-router';

import type { RegisterFormValues } from '@/auth/auth-ui';
import { AuthFormScreen } from '@/components/auth';
import { useAppContext } from '@/context/AppContext';
import { useAuthSession } from '@/hooks/useAuthSession';

export default function RegisterScreen() {
  const router = useRouter();
  const { updateRegistrationProfile } = useAppContext();
  const { register } = useAuthSession();

  return (
    <AuthFormScreen
      mode="register"
      onBack={() => router.back()}
      onSubmit={async (values) => {
        const registerValues = values as RegisterFormValues;
        await register({
          email: registerValues.email,
          password: registerValues.password,
          displayName: registerValues.displayName?.trim() || undefined,
        });
        updateRegistrationProfile({
          height: `${registerValues.heightCm}`,
          trainingExperience: registerValues.trainingExperience!,
        });
        router.replace('/onboarding');
      }}
      onSwitchMode={() => router.push('/auth/sign-in')}
    />
  );
}
