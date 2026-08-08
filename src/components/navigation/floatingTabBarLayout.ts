export const FLOATING_TAB_BAR_HEIGHT = 64;
export const FLOATING_TAB_BAR_MIN_BOTTOM_OFFSET = 12;
export const FLOATING_TAB_BAR_CONTENT_GAP = 16;

export function getFloatingTabBarBottomClearance(
  bottomInset: number,
  contentGap = FLOATING_TAB_BAR_CONTENT_GAP,
): number {
  const safeBottomInset = Number.isFinite(bottomInset) ? Math.max(0, bottomInset) : 0;
  const safeContentGap = Number.isFinite(contentGap) ? Math.max(0, contentGap) : 0;

  return (
    Math.max(safeBottomInset, FLOATING_TAB_BAR_MIN_BOTTOM_OFFSET) +
    FLOATING_TAB_BAR_HEIGHT +
    safeContentGap
  );
}

export function getFloatingTabBarStickyActionContentPadding(
  bottomInset: number,
  actionMinHeight: number,
  actionGap = 24,
): number {
  const safeActionHeight = Number.isFinite(actionMinHeight)
    ? Math.max(0, actionMinHeight)
    : 0;
  const safeActionGap = Number.isFinite(actionGap) ? Math.max(0, actionGap) : 0;

  return (
    getFloatingTabBarBottomClearance(bottomInset) + safeActionHeight + safeActionGap
  );
}
