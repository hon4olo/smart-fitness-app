import { describe, expect, it } from 'vitest';

import {
  FLOATING_TAB_BAR_CONTENT_GAP,
  FLOATING_TAB_BAR_HEIGHT,
  FLOATING_TAB_BAR_MIN_BOTTOM_OFFSET,
  getFloatingTabBarBottomClearance,
  getFloatingTabBarStickyActionContentPadding,
} from './floatingTabBarLayout';

describe('floating tab bar layout metrics', () => {
  it('uses the minimum visual bottom offset when the device inset is smaller', () => {
    expect(getFloatingTabBarBottomClearance(0)).toBe(
      FLOATING_TAB_BAR_MIN_BOTTOM_OFFSET +
        FLOATING_TAB_BAR_HEIGHT +
        FLOATING_TAB_BAR_CONTENT_GAP,
    );
  });

  it('uses the device safe-area inset when it is larger than the visual minimum', () => {
    expect(getFloatingTabBarBottomClearance(34)).toBe(
      34 + FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_CONTENT_GAP,
    );
  });

  it('adds sticky action height and spacing to scrollable content clearance', () => {
    expect(getFloatingTabBarStickyActionContentPadding(34, 48)).toBe(
      getFloatingTabBarBottomClearance(34) + 48 + 24,
    );
  });

  it('fails safe for invalid negative and non-finite measurements', () => {
    expect(getFloatingTabBarBottomClearance(-20, Number.NaN)).toBe(
      FLOATING_TAB_BAR_MIN_BOTTOM_OFFSET + FLOATING_TAB_BAR_HEIGHT,
    );
    expect(getFloatingTabBarStickyActionContentPadding(Number.NaN, -48, Number.NaN)).toBe(
      getFloatingTabBarBottomClearance(0),
    );
  });
});
