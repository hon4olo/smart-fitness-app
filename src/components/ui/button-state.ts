export type ButtonStateInput = {
  disabled?: boolean;
  loading?: boolean;
};

export type ButtonState = {
  disabled: boolean;
  loading: boolean;
  accessibilityState: {
    disabled: boolean;
    busy?: boolean;
  };
};

export const resolveButtonState = ({ disabled = false, loading = false }: ButtonStateInput): ButtonState => {
  const resolvedDisabled = disabled || loading;

  return {
    disabled: resolvedDisabled,
    loading,
    accessibilityState: {
      disabled: resolvedDisabled,
      busy: loading || undefined,
    },
  };
};
