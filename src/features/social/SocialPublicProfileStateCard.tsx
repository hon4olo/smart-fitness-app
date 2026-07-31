import { Text } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';

import type { SocialPublicProfileStyles } from './screens/SocialPublicProfileScreen.styles';

type SocialPublicProfileStateCardProps = {
  body: string;
  children?: React.ReactNode;
  styles: SocialPublicProfileStyles;
  title: string;
};

export function SocialPublicProfileStateCard({
  body,
  children,
  styles,
  title,
}: SocialPublicProfileStateCardProps) {
  return (
    <AppCard>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {children}
    </AppCard>
  );
}
