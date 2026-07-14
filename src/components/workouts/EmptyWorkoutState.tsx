import { EmptyState } from '@/components/ui/EmptyState';

type EmptyWorkoutStateProps = {
  actionLabel?: string;
  description?: string;
  message: string;
  onActionPress?: () => void;
  title?: string;
};

export function EmptyWorkoutState({ actionLabel, description, message, onActionPress, title }: EmptyWorkoutStateProps) {
  return (
    <EmptyState
      actionLabel={actionLabel}
      compact
      description={description ?? ''}
      message={message}
      onActionPress={onActionPress}
      title={title}
    />
  );
}
