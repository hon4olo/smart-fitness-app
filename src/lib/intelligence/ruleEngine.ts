export type Rule<TContext, TResult> = {
  id: string;
  priority: number;
  when: (context: TContext) => boolean;
  then: (context: TContext) => TResult;
};

export type RuleMatch<TResult> = {
  id: string;
  priority: number;
  result: TResult;
};

export type RecommendationTone = 'positive' | 'neutral' | 'warning';

export type DeterministicRecommendation = {
  id: string;
  title: string;
  detail: string;
  priority: number;
  tone: RecommendationTone;
};

export const clampNumber = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value));
};

export const safeDivide = (numerator: number, denominator: number) => {
  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
};

export const asPercent = (part: number, total: number) => {
  return safeDivide(part, total) * 100;
};

export const uniqueValues = <T>(values: T[]) => {
  return [...new Set(values)];
};

export const sumValues = (values: number[]) => {
  return values.reduce((total, value) => total + value, 0);
};

export const pickFirstDefined = <T>(values: Array<T | null | undefined>) => {
  return values.find((value): value is T => value !== null && value !== undefined);
};

export const sortByPriority = <T extends { priority: number }>(items: T[]) => {
  return [...items].sort((left, right) => right.priority - left.priority);
};

export const evaluateRules = <TContext, TResult>(context: TContext, rules: Rule<TContext, TResult>[]) => {
  return rules
    .map((rule, order) => ({
      order,
      rule,
      matches: rule.when(context),
    }))
    .filter((entry) => entry.matches)
    .sort((left, right) => right.rule.priority - left.rule.priority || left.order - right.order)
    .map<RuleMatch<TResult>>((entry) => ({
      id: entry.rule.id,
      priority: entry.rule.priority,
      result: entry.rule.then(context),
    }));
};

export const pickRuleResult = <TContext, TResult>(context: TContext, rules: Rule<TContext, TResult>[], fallback: TResult) => {
  return evaluateRules(context, rules)[0]?.result ?? fallback;
};

export const mapToRecommendations = (matches: RuleMatch<DeterministicRecommendation>[]) => {
  return sortByPriority(matches.map((match) => match.result));
};
