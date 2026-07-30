import type { SupportedLocale } from './messages';

const pluralRu = (count: number, forms: [string, string, string]) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
};

export const getNutritionCoachCopy = (locale: SupportedLocale) => ({
  back: locale === 'ru' ? 'Назад' : 'Back',
  title: locale === 'ru' ? 'Nutrition Coach' : 'Nutrition Coach',
  subtitle:
    locale === 'ru'
      ? 'Детерминированный анализ · контролируемый AI-предпросмотр'
      : 'Deterministic review · gated AI preview',
  preview: locale === 'ru' ? 'Предпросмотр' : 'Preview',
  providerAvailable:
    locale === 'ru' ? 'Структурированный strategy-provider доступен' : 'Structured strategy provider available',
  checkingCapabilities:
    locale === 'ru' ? 'Проверка возможностей backend' : 'Checking backend capabilities',
  deterministicAvailable:
    locale === 'ru' ? 'Детерминированный анализ доступен' : 'Deterministic review available',
  validatedAnalysis:
    locale === 'ru' ? 'Проверенный анализ питания' : 'Validated nutrition analysis',
  validatedBody:
    locale === 'ru'
      ? 'Детерминированный анализ всегда рассчитывается из синхронизированных записей. AI Strategy показывается только когда авторизованный backend сообщает о включённом структурированном provider.'
      : 'Deterministic review is always calculated from synchronized records. AI Strategy is shown only when the authenticated backend reports an enabled structured provider.',
  preparing:
    locale === 'ru' ? 'Подготовка аккаунта и данных питания…' : 'Preparing account and nutrition data…',
  signInRequired: locale === 'ru' ? 'Требуется вход' : 'Sign in required',
  signInBody:
    locale === 'ru'
      ? 'Nutrition Coach использует только данные, синхронизированные с защищённым backend-аккаунтом.'
      : 'Nutrition Coach reads only data synchronized to your protected backend account.',
  signIn: locale === 'ru' ? 'Войти' : 'Sign in',
  period: locale === 'ru' ? 'Период анализа' : 'Analysis period',
  days: (count: number, formatted: string) =>
    locale === 'ru'
      ? `${formatted} ${pluralRu(count, ['день', 'дня', 'дней'])}`
      : `${formatted} ${count === 1 ? 'day' : 'days'}`,
  reviewNutrition:
    locale === 'ru' ? 'Проверить синхронизированное питание' : 'Review synchronized nutrition',
  generateStrategy:
    locale === 'ru' ? 'Сформировать AI strategy-предпросмотр' : 'Generate AI strategy preview',
  strategyChecking:
    locale === 'ru' ? 'Проверка доступности AI Strategy…' : 'Checking whether AI Strategy is enabled…',
  strategyUnknown:
    locale === 'ru'
      ? 'Доступность AI Strategy не удалось проверить. Детерминированный анализ остаётся доступным.'
      : 'AI Strategy availability could not be verified. Deterministic review remains available.',
  strategyDisabled:
    locale === 'ru' ? 'AI strategy-provider не включён на этом backend.' : 'AI strategy provider is not enabled on this backend.',
  minimumTracking:
    locale === 'ru'
      ? 'Нужно минимум три отслеживаемых дня. Strategy-результат не применяется до успешного отдельного подтверждения.'
      : 'At least three tracked days are required. Strategy output is not applied until a separate confirmation succeeds.',
  requestError: locale === 'ru' ? 'Ошибка запроса' : 'Request error',
  reviewFailed:
    locale === 'ru'
      ? 'Nutrition Coach не смог завершить анализ. Проверьте подключение и синхронизацию.'
      : 'Nutrition Coach could not complete the review. Check connectivity and synchronization.',
  strategyFailed:
    locale === 'ru'
      ? 'Nutrition Strategy не смогла завершить предпросмотр.'
      : 'Nutrition Strategy could not complete the preview.',
  strategyNotEnabled:
    locale === 'ru' ? 'AI Strategy не включена на этом backend.' : 'AI strategy is not enabled on this backend.',
  strategyApplyFailed:
    locale === 'ru' ? 'Не удалось применить Nutrition Strategy.' : 'The Nutrition Strategy could not be applied.',
  applyTitle: locale === 'ru' ? 'Применить AI strategy?' : 'Apply AI strategy?',
  applyBody: (energy: string, energyUnit: string, protein: string, carbs: string, fats: string) =>
    locale === 'ru'
      ? `Заменить активную цель питания на ${energy} ${energyUnit}, белок ${protein} г, углеводы ${carbs} г и жиры ${fats} г?\n\nBackend проверит ревизию цели и повторно запустит детерминированные guardrails перед применением.`
      : `Replace the active nutrition target with ${energy} ${energyUnit}, ${protein} g protein, ${carbs} g carbs and ${fats} g fats?\n\nThe backend will verify the target revision and rerun deterministic guardrails before applying.`,
  cancel: locale === 'ru' ? 'Отмена' : 'Cancel',
  applyStrategy: locale === 'ru' ? 'Применить strategy' : 'Apply strategy',
  runStatus: {
    queued: locale === 'ru' ? 'В очереди' : 'Queued',
    running: locale === 'ru' ? 'Выполняется' : 'Running',
    completed: locale === 'ru' ? 'Завершено' : 'Completed',
    rejected: locale === 'ru' ? 'Отклонено' : 'Rejected',
    failed: locale === 'ru' ? 'Ошибка' : 'Failed',
  } as Record<string, string>,
  resultUnavailable: locale === 'ru' ? 'Результат недоступен' : 'Result unavailable',
  resultUnavailableBody:
    locale === 'ru'
      ? 'Результат не прошёл безопасную локальную проверку или запуск завершился ошибкой.'
      : 'The result did not pass safe local validation or the run could not be completed.',
  reason: locale === 'ru' ? 'Причина' : 'Reason',
  typedReason:
    locale === 'ru'
      ? 'Детерминированный анализ вернул типизированное отклонение. Проверьте полноту данных.'
      : 'The deterministic review returned a typed rejection. Review data completeness.',
  trackedDays: locale === 'ru' ? 'Отслеживаемые дни' : 'Tracked days',
  missingDays: locale === 'ru' ? 'Пропущенные дни' : 'Missing days',
  coverage: locale === 'ru' ? 'Покрытие' : 'Coverage',
  calendarAverage: locale === 'ru' ? 'Среднее за календарный день' : 'Average per calendar day',
  trackedAverage: locale === 'ru' ? 'Среднее за отслеживаемый день' : 'Average per tracked day',
  noTrackedAverage:
    locale === 'ru' ? 'Среднее за отслеживаемый день недоступно.' : 'No tracked-day average is available.',
  targetComparison: locale === 'ru' ? 'Сравнение с текущей целью' : 'Current target comparison',
  daysWithinCalories:
    locale === 'ru' ? 'Дни в пределах ±10% калорий' : 'Days within ±10% calories',
  trackedAdherence:
    locale === 'ru' ? 'Соблюдение в отслеживаемые дни' : 'Tracked-day adherence',
  trackedDelta: locale === 'ru' ? 'Отклонение калорий' : 'Tracked calorie delta',
  proteinPerWeight:
    locale === 'ru' ? 'Белок относительно массы тела' : 'Protein relative to body weight',
  weightBaseline: locale === 'ru' ? 'Базовая масса' : 'Weight baseline',
  dailyCoverage: locale === 'ru' ? 'Ежедневное покрытие' : 'Daily coverage',
  entries: (count: number, formatted: string) =>
    locale === 'ru'
      ? `${formatted} ${pluralRu(count, ['запись', 'записи', 'записей'])}`
      : `${formatted} ${count === 1 ? 'entry' : 'entries'}`,
  noEntries: locale === 'ru' ? 'Нет записей' : 'No entries',
  calories: locale === 'ru' ? 'Энергия' : 'Calories',
  protein: locale === 'ru' ? 'Белок' : 'Protein',
  carbs: locale === 'ru' ? 'Углеводы' : 'Carbs',
  fats: locale === 'ru' ? 'Жиры' : 'Fats',
  previewNotApplied: locale === 'ru' ? 'Предпросмотр · не применено' : 'Preview · not applied',
  applied: locale === 'ru' ? 'Применено к активной цели' : 'Applied to active target',
  revision: locale === 'ru' ? 'Ревизия' : 'Revision',
  confirmationBody:
    locale === 'ru'
      ? 'Применение требует отдельного подтверждения. Backend повторно загрузит запуск, проверит ревизию цели и запустит детерминированные guardrails.'
      : 'Applying requires a separate confirmation. The backend will reload the run, verify the target revision and rerun deterministic guardrails.',
  previewOnly:
    locale === 'ru'
      ? 'Этот backend поддерживает strategy-предпросмотр, но не объявляет подтверждение strategy.'
      : 'This backend supports strategy preview but does not advertise strategy confirmation.',
  strategy: locale === 'ru' ? 'Стратегия' : 'Strategy',
  guardrailValid: locale === 'ru' ? 'GUARDRAIL ПРОЙДЕН' : 'GUARDRAIL VALID',
  strategyLabels: {
    maintain: locale === 'ru' ? 'Поддержание' : 'Maintain',
    reduce: locale === 'ru' ? 'Снижение' : 'Reduce',
    increase: locale === 'ru' ? 'Повышение' : 'Increase',
    recompose: locale === 'ru' ? 'Рекомпозиция' : 'Recompose',
  } as Record<string, string>,
  confidence: locale === 'ru' ? 'Уверенность' : 'Confidence',
  dataQuality: locale === 'ru' ? 'Качество данных' : 'Data quality',
  cadence: locale === 'ru' ? 'Частота корректировки' : 'Adjustment cadence',
  macroCalories: locale === 'ru' ? 'Калории из макросов' : 'Macro calories',
  mismatch: locale === 'ru' ? 'Расхождение расчёта калорий' : 'Calorie math mismatch',
  attempts: locale === 'ru' ? 'Попытки валидации' : 'Validation attempts',
  summary: locale === 'ru' ? 'Сводка' : 'Summary',
  rationale: locale === 'ru' ? 'Обоснование' : 'Rationale',
  caveats: locale === 'ru' ? 'Ограничения' : 'Caveats',
  deterministicIssues:
    locale === 'ru' ? 'Детерминированные результаты' : 'Deterministic issues',
  typedIssue:
    locale === 'ru'
      ? 'Детерминированный guardrail вернул типизированный результат. Проверьте код и контекст.'
      : 'A deterministic guardrail returned a typed finding. Review its code and context.',
  confirmationText:
    locale === 'ru'
      ? 'Подтверждение заменит активную цель калорий и макросов значениями выше.'
      : 'Confirmation replaces the active calorie and macro target with the values shown above.',
  applyTargets:
    locale === 'ru' ? 'Применить strategy к целям' : 'Apply strategy to targets',
});

export type NutritionCoachCopy = ReturnType<typeof getNutritionCoachCopy>;
