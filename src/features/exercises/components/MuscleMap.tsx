import { memo, useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppTheme } from '@/theme/AppThemeProvider';

import { CANONICAL_MUSCLES, type CanonicalMuscleId, type MuscleHighlightMap, type MuscleSide } from '../muscleTaxonomy';

type MuscleMapProps = {
  highlights: MuscleHighlightMap;
  side: MuscleSide;
};

type MuscleShape = {
  id: CanonicalMuscleId;
  shape: string;
};

const FRONT_SHAPES: MuscleShape[] = [
  { id: 'front-delts', shape: '<circle cx="68" cy="82" r="13"/><circle cx="132" cy="82" r="13"/>' },
  { id: 'chest', shape: '<rect x="69" y="88" width="62" height="36" rx="15"/>' },
  { id: 'biceps', shape: '<rect x="45" y="98" width="18" height="54" rx="9"/><rect x="137" y="98" width="18" height="54" rx="9"/>' },
  { id: 'forearms', shape: '<rect x="35" y="150" width="16" height="58" rx="8"/><rect x="149" y="150" width="16" height="58" rx="8"/>' },
  { id: 'abs', shape: '<rect x="78" y="126" width="44" height="62" rx="15"/>' },
  { id: 'obliques', shape: '<rect x="62" y="130" width="18" height="58" rx="9"/><rect x="120" y="130" width="18" height="58" rx="9"/>' },
  { id: 'quads', shape: '<rect x="68" y="202" width="26" height="76" rx="12"/><rect x="106" y="202" width="26" height="76" rx="12"/>' },
];

const BACK_SHAPES: MuscleShape[] = [
  { id: 'rear-delts', shape: '<circle cx="68" cy="82" r="13"/><circle cx="132" cy="82" r="13"/>' },
  { id: 'traps', shape: '<path d="M82 72h36l18 46H64z"/>' },
  { id: 'lats', shape: '<path d="M63 114h30v78H50z"/><path d="M107 114h30l13 78h-43z"/>' },
  { id: 'triceps', shape: '<rect x="45" y="98" width="18" height="54" rx="9"/><rect x="137" y="98" width="18" height="54" rx="9"/>' },
  { id: 'lower-back', shape: '<rect x="78" y="164" width="44" height="42" rx="14"/>' },
  { id: 'glutes', shape: '<rect x="66" y="206" width="30" height="36" rx="14"/><rect x="104" y="206" width="30" height="36" rx="14"/>' },
  { id: 'hamstrings', shape: '<rect x="68" y="244" width="26" height="72" rx="12"/><rect x="106" y="244" width="26" height="72" rx="12"/>' },
  { id: 'calves', shape: '<rect x="70" y="318" width="22" height="58" rx="10"/><rect x="108" y="318" width="22" height="58" rx="10"/>' },
];

const encodeSvg = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const createSvgUri = (side: MuscleSide, highlights: MuscleHighlightMap, colors: typeof Colors.dark) => {
  const shapes = side === 'front' ? FRONT_SHAPES : BACK_SHAPES;
  const baseFill = colors.surfaceElevated;
  const stroke = colors.borderSubtle;
  const primaryFill = colors.accent;
  const secondaryFill = colors.warning;

  const body = shapes
    .map((shape) => {
      const role = highlights[shape.id];
      const fill = role === 'primary' ? primaryFill : role === 'secondary' ? secondaryFill : baseFill;

      return `<g fill="${fill}" stroke="${stroke}" stroke-width="2">${shape.shape}</g>`;
    })
    .join('');

  return encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="400" viewBox="0 0 200 400">
      <rect width="200" height="400" rx="20" fill="${colors.surfaceSecondary}"/>
      <circle cx="100" cy="44" r="24" fill="${baseFill}" stroke="${stroke}" stroke-width="2"/>
      <rect x="76" y="68" width="48" height="144" rx="22" fill="${baseFill}" stroke="${stroke}" stroke-width="2"/>
      <rect x="65" y="198" width="70" height="44" rx="18" fill="${baseFill}" stroke="${stroke}" stroke-width="2"/>
      <rect x="36" y="92" width="20" height="120" rx="10" fill="${baseFill}" stroke="${stroke}" stroke-width="2"/>
      <rect x="144" y="92" width="20" height="120" rx="10" fill="${baseFill}" stroke="${stroke}" stroke-width="2"/>
      <rect x="66" y="238" width="28" height="140" rx="14" fill="${baseFill}" stroke="${stroke}" stroke-width="2"/>
      <rect x="106" y="238" width="28" height="140" rx="14" fill="${baseFill}" stroke="${stroke}" stroke-width="2"/>
      ${body}
    </svg>
  `);
};

export const MuscleMap = memo(function MuscleMap({ highlights, side }: MuscleMapProps) {
  const { colors } = useAppTheme();
  const svgUri = useMemo(() => createSvgUri(side, highlights, colors), [colors, highlights, side]);
  const highlightedLabels = CANONICAL_MUSCLES
    .filter((muscle) => muscle.side === side && highlights[muscle.id])
    .map((muscle) => muscle.label)
    .join(', ');

  return (
    <View style={styles.container}>
      <Image
        accessibilityLabel={`${side === 'front' ? 'Front' : 'Back'} muscle map${highlightedLabels ? ` highlighting ${highlightedLabels}` : ''}.`}
        resizeMode="contain"
        source={{ uri: svgUri }}
        style={styles.image}
      />
      <Text style={[styles.label, { color: colors.textSecondary }]}>{side === 'front' ? 'Front' : 'Back'}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceSecondary,
    borderColor: Colors.dark.borderSubtle,
    borderRadius: Radii.large,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    gap: Spacing.two,
    minWidth: 0,
    padding: Spacing.three,
  },
  image: {
    aspectRatio: 0.5,
    width: '100%',
  },
  label: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.label.fontWeight,
  },
});
