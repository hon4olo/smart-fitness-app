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

export const getNutritionAddFoodCopy = (locale: SupportedLocale) => {
  const mealLabels: Record<MealType, string> = {
    breakfast: locale === 'ru' ? 'Завтрак' : 'Breakfast',
    lunch: locale === 'ru' ? 'Обед' : 'Lunch',
    dinner: locale === 'ru' ? 'Ужин' : 'Dinner',
    snack: locale === 'ru' ? 'Перекус' : 'Snack',
  };

  const fieldLabels = {
    calories: locale === 'ru' ? 'Энергия' : 'Energy',
    protein: locale === 'ru' ? 'Белки' : 'Protein',
    fat: locale === 'ru' ? 'Жиры' : 'Fat',
    carbs: locale === 'ru' ? 'Углеводы' : 'Carbs',
  } as const;

  return {
    mealLabels,
    cancel: locale === 'ru' ? 'Отмена' : 'Cancel',
    delete: locale === 'ru' ? 'Удалить' : 'Delete',
    saveChanges: locale === 'ru' ? 'Сохранить изменения' : 'Save changes',
    addToMeal: (meal: string) =>
      locale === 'ru' ? `Добавить в «${meal}»` : `Add to ${meal}`,
    itemCount: (count: number, formatted: string) =>
      locale === 'ru'
        ? `${formatted} ${pluralRu(count, ['запись', 'записи', 'записей'])}`
        : `${formatted} item${count === 1 ? '' : 's'}`,
    addedToMeal: (name: string, meal: string) =>
      locale === 'ru' ? `${name} добавлен в «${meal}»` : `Added ${name} to ${meal}`,
    enterValidQuantity:
      locale === 'ru' ? 'Введите корректное количество.' : 'Enter a valid quantity.',
    deleteFoodEntryTitle:
      locale === 'ru' ? 'Удалить запись о продукте?' : 'Delete food entry?',
    deleteFoodEntryBody: (name: string) =>
      locale === 'ru'
        ? `${name} будет удалён из этого приёма пищи.`
        : `${name} will be removed from this meal.`,
    checkCustomFoodFields:
      locale === 'ru' ? 'Проверьте поля нового продукта.' : 'Check the custom food fields.',
    addedAndSaved: (name: string) =>
      locale === 'ru'
        ? `${name} добавлен и сохранён в «Мои продукты»`
        : `Added ${name} and saved it to My foods`,
    enterMealName: locale === 'ru' ? 'Введите название приёма пищи.' : 'Enter a meal name.',
    noFoodInMeal:
      locale === 'ru'
        ? 'В этом приёме пищи пока нет продуктов.'
        : 'No food logged in this meal yet.',
    savedMeal: (name: string) =>
      locale === 'ru' ? `Сохранено: ${name}` : `Saved ${name}`,
    updatedMeal: (name: string) =>
      locale === 'ru' ? `Обновлено: ${name}` : `Updated ${name}`,
    deleteSavedMealTitle:
      locale === 'ru' ? 'Удалить сохранённый приём пищи?' : 'Delete saved meal?',
    deleteSavedMealBody: (name: string) =>
      locale === 'ru'
        ? `${name} больше не будет доступен.`
        : `${name} will no longer be available.`,
    noFoodToReplace: (meal: string) =>
      locale === 'ru'
        ? `В «${meal}» нет продуктов, которыми можно заменить этот шаблон.`
        : `No food logged in ${meal.toLowerCase()} to replace this meal.`,
    source: (provider: string) =>
      locale === 'ru' ? `Источник: ${provider}` : `Source: ${provider}`,
    fatSecretAttribution:
      locale === 'ru'
        ? 'Данные о продукте предоставлены FatSecret'
        : 'Food data provided by FatSecret',
    providerLabels: {
      custom: locale === 'ru' ? 'Свой' : 'Custom',
      local: locale === 'ru' ? 'Локальный' : 'Local',
      manual: locale === 'ru' ? 'Вручную' : 'Manual',
      usda: locale === 'ru' ? 'Локальный' : 'Local',
      fatsecret: 'FatSecret',
      openfoodfacts: 'OpenFoodFacts',
    },
    pickerMode: locale === 'ru' ? 'Режим выбора продукта' : 'Food picker mode',
    modes: {
      food: locale === 'ru' ? 'Продукты' : 'Food',
      recent: locale === 'ru' ? 'Недавние' : 'Recent',
      favorites: locale === 'ru' ? 'Избранное' : 'Favorites',
      meals: locale === 'ru' ? 'Приёмы пищи' : 'Meals',
    },
    createFood: locale === 'ru' ? 'Создать продукт' : 'Create food',
    hideCreateFood: locale === 'ru' ? 'Скрыть создание продукта' : 'Hide create food',
    createMeal: locale === 'ru' ? 'Создать приём пищи' : 'Create meal',
    goToMeals: locale === 'ru' ? 'Перейти к приёмам пищи' : 'Go to meals mode',
    deleteEntry: locale === 'ru' ? 'Удалить запись' : 'Delete entry',
    searchFood: locale === 'ru' ? 'Поиск продуктов' : 'Search food',
    clearSearch: locale === 'ru' ? 'Очистить поиск' : 'Clear search',
    scan: locale === 'ru' ? 'Сканировать' : 'Scan',
    scanBarcode:
      locale === 'ru' ? 'Сканировать штрихкод продукта' : 'Scan food barcode',
    searchSuggestion: (suggestion: string) =>
      locale === 'ru' ? `Искать ${suggestion}` : `Search ${suggestion}`,
    waitingForTyping:
      locale === 'ru'
        ? 'Ожидание завершения ввода…'
        : 'Waiting for you to finish typing…',
    searchingDatabase:
      locale === 'ru' ? 'Поиск в базе продуктов…' : 'Searching food database…',
    noOnlineMatches:
      locale === 'ru'
        ? 'Совпадений онлайн нет. Ниже показаны локальные продукты.'
        : 'No online matches. Local foods are shown below.',
    databaseUnavailable:
      locale === 'ru'
        ? 'База продуктов недоступна. Проверьте подключение или используйте локальные продукты.'
        : 'Food database unavailable. Check your connection or use local foods.',
    noFoodFound: locale === 'ru' ? 'Продукты не найдены' : 'No food found',
    tapToSetPortion:
      locale === 'ru'
        ? 'Коснитесь, чтобы выбрать порцию перед добавлением'
        : 'Tap to set a portion before adding',
    addFavorite: (name: string) =>
      locale === 'ru' ? `Добавить ${name} в избранное` : `Add ${name} to favorites`,
    removeFavorite: (name: string) =>
      locale === 'ru' ? `Удалить ${name} из избранного` : `Remove ${name} from favorites`,
    quickAdd: (name: string, meal: string) =>
      locale === 'ru' ? `Быстро добавить ${name} в «${meal}»` : `Quick add ${name} to ${meal}`,
    recentFoods: locale === 'ru' ? 'Недавние продукты' : 'Recent foods',
    recentFallback: locale === 'ru' ? 'недавний' : 'recent',
    adjustPortion:
      locale === 'ru' ? 'Коснитесь, чтобы изменить порцию' : 'Tap to adjust the portion',
    noRecentFoods:
      locale === 'ru' ? 'Недавних продуктов пока нет.' : 'No recent foods yet.',
    favoritesTitle:
      locale === 'ru' ? 'Избранное и мои продукты' : 'Favorites & my foods',
    myFood: locale === 'ru' ? 'Мой продукт' : 'My food',
    favorite: locale === 'ru' ? 'Избранное' : 'Favorite',
    removeFromLibrary: (name: string) =>
      locale === 'ru'
        ? `Удалить ${name} из библиотеки продуктов`
        : `Remove ${name} from food library`,
    noFavorites:
      locale === 'ru'
        ? 'Избранных и собственных продуктов пока нет. Отмечайте продукты звездой или создайте свой.'
        : 'No favorites or custom foods yet. Add foods with the star button or create your own food.',
    mealsTitle: locale === 'ru' ? 'Приёмы пищи' : 'Meals',
    manageMeals: locale === 'ru' ? 'Управлять' : 'Manage meals',
    doneManaging: locale === 'ru' ? 'Готово' : 'Done managing',
    mealName: locale === 'ru' ? 'Название приёма пищи' : 'Meal name',
    saveCurrentMealHint: (meal: string) =>
      locale === 'ru'
        ? `Сохраняет текущие продукты из «${meal}» как повторно используемый приём пищи.`
        : `Saves the current ${meal.toLowerCase()} diary items as a reusable meal.`,
    saveMeal: locale === 'ru' ? 'Сохранить приём пищи' : 'Save meal',
    openSavedMeal:
      locale === 'ru' ? 'Открыть детали сохранённого приёма пищи' : 'Open saved meal details',
    addSavedMeal: (name: string, meal: string) =>
      locale === 'ru' ? `Добавить ${name} в «${meal}»` : `Add ${name} to ${meal}`,
    deleteSavedMeal: (name: string) =>
      locale === 'ru' ? `Удалить ${name}` : `Delete ${name}`,
    savedMealName:
      locale === 'ru' ? 'Название сохранённого приёма пищи' : 'Saved meal name',
    saveName: locale === 'ru' ? 'Сохранить название' : 'Save name',
    replaceWithCurrent: (meal: string) =>
      locale === 'ru' ? `Заменить текущим «${meal}»` : `Replace with current ${meal.toLowerCase()}`,
    noSavedMeals:
      locale === 'ru' ? 'Сохранённых приёмов пищи пока нет.' : 'No saved meals yet.',
    createFoodTitle: locale === 'ru' ? 'Создать продукт' : 'Create food',
    createFoodHint:
      locale === 'ru'
        ? 'Введите пищевую ценность одной порции, затем выберите добавляемое количество.'
        : 'Enter nutrition values for one serving, then choose the amount to add.',
    foodName: locale === 'ru' ? 'Название продукта' : 'Food name',
    foodExample: locale === 'ru' ? 'Например: греческий йогурт' : 'Example: Greek yogurt',
    brand: locale === 'ru' ? 'Бренд' : 'Brand',
    optional: locale === 'ru' ? 'Необязательно' : 'Optional',
    servingSize: locale === 'ru' ? 'Размер порции' : 'Serving size',
    servingUnit: locale === 'ru' ? 'Единица порции' : 'Serving unit',
    unit: locale === 'ru' ? 'Единица' : 'Unit',
    amountToAdd: locale === 'ru' ? 'Добавляемое количество' : 'Amount to add',
    quantity: locale === 'ru' ? 'Количество' : 'Quantity',
    energy: locale === 'ru' ? 'Энергия' : 'Energy',
    protein: locale === 'ru' ? 'Белки' : 'Protein',
    carbs: locale === 'ru' ? 'Углеводы' : 'Carbs',
    fats: locale === 'ru' ? 'Жиры' : 'Fats',
    addFood: locale === 'ru' ? 'Добавить продукт' : 'Add food',
    validation: {
      foodName: locale === 'ru' ? 'Введите название продукта.' : 'Enter a food name.',
      servingUnit: locale === 'ru' ? 'Введите единицу порции.' : 'Enter a serving unit.',
      greaterThanZero:
        locale === 'ru' ? 'Используйте число больше 0.' : 'Use a number greater than 0.',
      number: locale === 'ru' ? 'Введите число.' : 'Enter a number.',
      zeroOrMore: locale === 'ru' ? 'Используйте 0 или больше.' : 'Use 0 or more.',
    },
    closePortionEditor:
      locale === 'ru' ? 'Закрыть редактор порции' : 'Close portion editor',
    updateEntryHint:
      locale === 'ru'
        ? 'Обновите выбранную запись, сохранив текущий контекст дневника.'
        : 'Update the selected entry and keep the diary context unchanged.',
    addEntryHint:
      locale === 'ru'
        ? 'Добавьте продукт в выбранный приём пищи, не покидая экран выбора.'
        : 'Add this food to the selected meal without leaving the picker.',
    scanner: {
      close: locale === 'ru' ? 'Закрыть' : 'Close',
      closeScanner:
        locale === 'ru' ? 'Закрыть сканер штрихкода' : 'Close barcode scanner',
      title: locale === 'ru' ? 'Сканировать штрихкод' : 'Scan barcode',
      lookingUp: locale === 'ru' ? 'Поиск продукта…' : 'Looking up food...',
      productNotFound: locale === 'ru' ? 'Продукт не найден' : 'Product not found',
      lookupError:
        locale === 'ru'
          ? 'Не удалось проверить штрихкод. Проверьте подключение и повторите попытку.'
          : 'Could not look up this barcode. Check your connection and try again.',
      addProduct: locale === 'ru' ? 'Добавить продукт' : 'Add product',
      nutritionPer: (unit: string) =>
        locale === 'ru' ? `Пищевая ценность на 100 ${unit}` : `Nutrition per 100${unit}`,
      closeManualForm:
        locale === 'ru' ? 'Закрыть форму продукта' : 'Close manual product form',
      barcode: locale === 'ru' ? 'Штрихкод' : 'Barcode',
      productName: locale === 'ru' ? 'Название продукта' : 'Product name',
      namePlaceholder: locale === 'ru' ? 'Название' : 'Name',
      useGrams: locale === 'ru' ? 'Использовать 100 граммов' : 'Use 100 grams',
      useMilliliters:
        locale === 'ru' ? 'Использовать 100 миллилитров' : 'Use 100 milliliters',
      fieldLabels,
      required: locale === 'ru' ? 'Обязательное поле' : 'Required',
      zeroOrMore: locale === 'ru' ? 'Значение должно быть не меньше 0' : 'Must be 0 or more',
      max: (label: string, max: number) =>
        locale === 'ru' ? `${label}: максимум ${max}` : `${label} max ${max}`,
      saveProduct: locale === 'ru' ? 'Сохранить продукт' : 'Save product',
      saveError:
        locale === 'ru'
          ? 'Не удалось сохранить продукт. Повторите попытку.'
          : 'Could not save this product. Try again.',
      alignBarcode:
        locale === 'ru'
          ? 'Расположите штрихкод внутри рамки'
          : 'Align the barcode inside the frame',
      cameraNeeded: locale === 'ru' ? 'Нужен доступ к камере' : 'Camera access needed',
      cameraOff:
        locale === 'ru'
          ? 'Доступ к камере выключен. Разрешите его для сканирования или вернитесь к поиску вручную.'
          : 'Camera permission is off. Allow camera access to scan barcodes, or return to manual search.',
      cameraUse:
        locale === 'ru'
          ? 'Камера используется только для сканирования штрихкодов продуктов.'
          : 'We use the camera to scan food barcodes.',
      allowCamera: locale === 'ru' ? 'Разрешить камеру' : 'Allow camera',
      manualSearch: locale === 'ru' ? 'Поиск вручную' : 'Manual search',
      returnManualSearch:
        locale === 'ru' ? 'Вернуться к поиску продукта вручную' : 'Return to manual food search',
      futureScans:
        locale === 'ru'
          ? 'Добавьте продукт один раз, и следующие сканирования найдут его автоматически.'
          : 'Add it once and future scans will find it automatically.',
      addManually: locale === 'ru' ? 'Добавить вручную' : 'Add manually',
      searchByName: locale === 'ru' ? 'Искать по названию' : 'Search by name',
      tryAgain: locale === 'ru' ? 'Повторить' : 'Try again',
    },
  };
};

export type NutritionAddFoodCopy = ReturnType<typeof getNutritionAddFoodCopy>;
