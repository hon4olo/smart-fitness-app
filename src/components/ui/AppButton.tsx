import type { StyleProp, ViewStyle } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';

type AppButtonProps = {
  disabled?: boolean;
  label: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'secondary';
};

export function AppButton({ disabled = false, label, onPress, style, variant = 'primary' }: AppButtonProps) {
  return variant === 'primary' ? (
    <PrimaryButton disabled={disabled} label={label} onPress={onPress} style={style} />
  ) : (
    <SecondaryButton disabled={disabled} label={label} onPress={onPress} style={style} />
  );
}
