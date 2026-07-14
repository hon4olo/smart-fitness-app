import { StatChip } from '@/components/ui/StatChip';

type MetricCardProps = {
  label: string;
  value: string;
  detail?: string;
};

export function MetricCard({ label, value, detail }: MetricCardProps) {
  return <StatChip detail={detail} label={label} value={value} />;
}
