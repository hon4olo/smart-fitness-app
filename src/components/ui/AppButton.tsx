import type { StyleProp, ViewStyle } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';

type AppButtonProps = {
  disabled?: boolean;
  label: string;
  loading?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'secondary';
};

export function AppButton({ disabled = false, label, loading = false, onPress, style, variant = 'primary' }: AppButtonProps) {
  return variant === 'primary' ? (
    <PrimaryButton disabled={disabled} label={label} loading={loading} onPress={onPress} style={style} />
  ) : (
    <SecondaryButton disabled={disabled} label={label} loading={loading} onPress={onPress} style={style} />
  );
}
