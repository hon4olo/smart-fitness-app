import type { MealType } from '@/types';

import type { SupportedLocale } from './messages';

const pluralRu = (
  count: number,
  forms: [one: string, few: string, many: string],
) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
};

export const getNutritionDiaryCopy = (locale: SupportedLocale) => {
  const mealLabels: Record<MealType, string> = {
    breakfast: locale === 'ru' ? 'Завтрак' : 'Breakfast',
    lunch: locale === 'ru' ? 'Обед' : 'Lunch',
    dinner: locale === 'ru' ? 'Ужин' : 'Dinner',
    snack: locale === 'ru' ? 'Перекус' : 'Snack',
  };

  return {
    title: locale === 'ru' ? 'Питание' : 'Nutrition',
    mealDiary: locale === 'ru' ? 'Дневник питания' : 'Meal diary',
    nutritionDetails: locale === 'ru' ? 'Подробности питания' : 'Nutrition details',
    fiber: locale === 'ru' ? 'Клетчатка' : 'Fiber',
    today: locale === 'ru' ? 'Сегодня' : 'Today',
    todaySelected: locale === 'ru' ? 'Выбран сегодняшний день' : 'Today selected',
    jumpToToday: locale === 'ru' ? 'Перейти к сегодняшнему дню' : 'Jump to today',
    openCalendar: (date: string) =>
      locale === 'ru' ? `Открыть календарь для ${date}` : `Open calendar for ${date}`,
    weekDayAccessibility: (weekday: string, isLogged: boolean, isToday: boolean) => {
      const status = locale === 'ru'
        ? isLogged ? 'питание записано' : 'питание не записано'
        : isLogged ? 'food logged' : 'no food logged';
      const today = isToday ? (locale === 'ru' ? ', сегодня' : ', today') : '';
      return `${weekday}, ${status}${today}`;
    },
    streak: (count: number, formatted: string) =>
      locale === 'ru'
        ? `${formatted} ${pluralRu(count, ['день', 'дня', 'дней'])} подряд`
        : `${formatted} day${count === 1 ? '' : 's'} streak`,
    mealLabels,
    mealAccessibility: (meal: string) =>
      locale === 'ru' ? `Приём пищи: ${meal}` : `${meal} meal`,
    addFoodToMeal: (meal: string) =>
      locale === 'ru' ? `Добавить продукт в ${meal.toLowerCase()}` : `Add food to ${meal}`,
    editFoodHint:
      locale === 'ru' ? 'Коснитесь, чтобы изменить запись о продукте' : 'Tap to edit this food entry',
    noMetadata: locale === 'ru' ? 'нет дополнительных данных' : 'no metadata',
    editFoodLabel: (
      name: string,
      metadata: string,
      fats: string,
      carbs: string,
      protein: string,
      target: string,
      calories: string,
      energyUnit: string,
    ) =>
      locale === 'ru'
        ? `Изменить ${name}, ${metadata}, жиры ${fats}, углеводы ${carbs}, белки ${protein}, ${target} от цели, ${calories} ${energyUnit}`
        : `Edit ${name}, ${metadata}, ${fats} fat, ${carbs} carbs, ${protein} protein, ${target} of target, ${calories} ${energyUnit}`,
    itemCount: (count: number, formatted: string) =>
      locale === 'ru'
        ? `${formatted} ${pluralRu(count, ['запись', 'записи', 'записей'])}`
        : `${formatted} item${count === 1 ? '' : 's'}`,
    macroLabels: {
      fats: locale === 'ru' ? 'Жиры' : 'Fat',
      carbs: locale === 'ru' ? 'Углеводы' : 'Carbs',
      protein: locale === 'ru' ? 'Белки' : 'Protein',
      target: locale === 'ru' ? 'Цель' : 'Target',
      calories: locale === 'ru' ? 'Энергия' : 'Calories',
    },
  };
};