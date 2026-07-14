import { EmptyState } from '@/components/ui/EmptyState';

type NutritionEmptyStateProps = {
  compact?: boolean;
  description: string;
  title: string;
};

export function NutritionEmptyState({ compact = false, description, title }: NutritionEmptyStateProps) {
  return <EmptyState compact={compact} description={description} title={title} />;
}
