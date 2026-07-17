import { Alert } from 'react-native';

export const showComingSoon = (title: string, message: string) => {
  Alert.alert(title, message, [{ text: 'OK', style: 'default' }]);
};
