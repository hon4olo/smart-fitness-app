import { EmptyState } from '@/components/ui/EmptyState';

type EmptyProgressStateProps = {
  actionLabel?: string;
  description?: string;
  message: string;
  onActionPress?: () => void;
  title?: string;
};

export function EmptyProgressState({ actionLabel, description, message, onActionPress, title }: EmptyProgressStateProps) {
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
