import { Pressable, Text, View } from 'react-native';

type ProgramBuilderStyles = Record<string, any>;

export function PillRow({
  label,
  items,
  onSelect,
  selectedValue,
  styles,
}: {
  items: readonly string[];
  label: string;
  onSelect: (value: string) => void;
  selectedValue?: string;
  styles: ProgramBuilderStyles;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text selectable style={styles.inputLabel}>
        {label}
      </Text>
      <View style={styles.pillRow}>
        {items.map((item) => {
          const selected = item === selectedValue;
          return (
            <Pressable key={item} onPress={() => onSelect(item)} style={({ pressed }) => [styles.pill, selected && styles.pillSelected, pressed && styles.pillPressed]}>
              <Text style={[styles.pillLabel, selected && styles.pillLabelSelected]}>{item}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function MetricTile({ detail, label, styles, value }: { detail: string; label: string; styles: ProgramBuilderStyles; value: string }) {
  return (
    <View style={styles.metricTile}>
      <Text selectable style={styles.metricLabel}>
        {label}
      </Text>
      <Text selectable style={styles.metricValue}>
        {value}
      </Text>
      <Text selectable style={styles.metricDetail}>
        {detail}
      </Text>
    </View>
  );
}

export function CompactAction({ label, onPress, styles, tone = 'secondary' }: { label: string; onPress: () => void; styles: ProgramBuilderStyles; tone?: 'primary' | 'secondary' }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.compactAction, tone === 'primary' ? styles.compactActionPrimary : styles.compactActionSecondary, pressed && styles.compactActionPressed]}>
      <Text style={tone === 'primary' ? styles.compactActionLabelPrimary : styles.compactActionLabelSecondary}>{label}</Text>
    </Pressable>
  );
}

export function SectionHeading({
  collapsed,
  onToggle,
  styles,
  subtitle,
  title,
}: {
  collapsed?: boolean;
  onToggle?: () => void;
  styles: ProgramBuilderStyles;
  subtitle?: string;
  title: string;
}) {
  return (
    <Pressable disabled={!onToggle} onPress={onToggle} style={({ pressed }) => [styles.sectionHeading, pressed && onToggle && styles.sectionHeadingPressed]}>
      <View style={styles.sectionHeadingCopy}>
        <Text selectable style={styles.sectionTitle}>
          {title}
        </Text>
        {subtitle ? <Text selectable style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {onToggle ? <Text style={styles.sectionToggle}>{collapsed ? '+' : '−'}</Text> : null}
    </Pressable>
  );
}
