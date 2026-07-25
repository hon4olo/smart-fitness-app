import type { SupportedLocale } from '@/localization';

const copy = {
  en: {
    section: 'Units',
    weight: 'Weight',
    weightDescription: 'Display workout and body weight in kilograms or pounds.',
    length: 'Body measurements',
    lengthDescription: 'Display height and body measurements in centimeters or inches.',
    energy: 'Energy',
    energyDescription: 'Display food energy in kilocalories or kilojoules.',
    footer: 'Units change display and input only. Stored values and calculations remain metric.',
  },
  ru: {
    section: 'Единицы измерения',
    weight: 'Вес',
    weightDescription: 'Показывать рабочий и телесный вес в килограммах или фунтах.',
    length: 'Размеры тела',
    lengthDescription: 'Показывать рост и размеры тела в сантиметрах или дюймах.',
    energy: 'Энергия',
    energyDescription: 'Показывать энергию пищи в килокалориях или килоджоулях.',
    footer: 'Единицы меняют только ввод и отображение. Хранение и расчёты остаются метрическими.',
  },
} as const;

export const getUnitCopy = (locale: SupportedLocale) => copy[locale];
