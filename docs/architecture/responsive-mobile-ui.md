# Responsive Mobile UI Contract

Updated: 2026-08-08

## Purpose

This document is the focused architecture contract for responsive React Native layout in Smart Fitness. It applies to new UI work and to remediation of existing screens.

The goal is not to eliminate pixel values. The goal is to eliminate screen-specific pixel positioning, unsafe system-UI overlap, and layouts that only work at one viewport size.

## Core layout rules

### 1. Build structure with Flexbox, not screen-relative nudges

Use `flex`, `flexGrow`, `flexShrink`, `gap`, `padding`, `minHeight`, `maxWidth`, natural content size, and sibling alignment for primary layout.

Do not place key content or actions using arbitrary `top`, `bottom`, `left`, `right`, large `marginTop`, or large `paddingTop` values chosen to fit one device.

Fixed dimensions remain valid when they are part of the component contract rather than screen positioning, for example:

- icons and avatars;
- touch targets;
- text inputs;
- compact controls;
- card media with an intentional aspect ratio;
- tab-bar geometry.

Prefer `minHeight` over a hard `height` when text can grow.

### 2. Safe area is mandatory at system-UI boundaries

Full-screen surfaces must account for safe-area insets when content or controls can overlap:

- status bar, notch, or Dynamic Island;
- Home Indicator;
- Android navigation/system bars.

Use `react-native-safe-area-context` and `useSafeAreaInsets()` for explicit dynamic offsets.

Do not compensate for the same inset twice. If a navigator already owns a safe-area edge, the child screen should not blindly add that inset again.

### 3. Floating tab-bar clearance is a shared geometry contract

The custom floating tab bar has shared layout metrics under:

`src/components/navigation/floatingTabBarLayout.ts`

Tab screens must calculate bottom content clearance with `getFloatingTabBarBottomClearance(bottomInset)` instead of independent constants such as `safeArea.bottom + 120`.

A sticky action above the floating tab bar must reserve both:

1. tab-bar/system clearance; and
2. action height plus spacing in the scrollable content.

Use `getFloatingTabBarStickyActionContentPadding(...)` for that case.

When the tab-bar geometry changes, update the shared metrics and its tests before changing consumers.

### 4. Scroll only when the content model requires it

For bounded ordinary screen content, use `ScrollView` with a content container that can grow:

```tsx
<ScrollView
  contentContainerStyle={{ flexGrow: 1 }}
  keyboardShouldPersistTaps="handled"
>
```

Use `keyboardShouldPersistTaps="handled"` on scrollable forms.

For potentially long collections, use virtualization:

- `FlatList`;
- `SectionList`.

Do not render a potentially long list with `.map()` inside a bounded modal or screen when item count can grow with user data. Use a virtualized list and give it bounded viewport ownership.

Do not place a large same-axis virtualized list inside a vertical `ScrollView`.

Horizontal carousels inside a vertical screen are acceptable when bounded.

### 5. Bottom actions may be sticky, but must be inset-aware

`position: 'absolute'` is not globally prohibited. It is valid for overlays and genuinely floating/sticky controls.

For a sticky action:

- calculate `bottom` from safe-area/navigation geometry;
- reserve equivalent content padding so the final scroll item is never hidden;
- avoid a device-specific fixed `bottom` value;
- allow the control width and label to shrink on narrow screens.

If the sticky control can change height because of localization or accessibility text sizing, measure the rendered control and reserve its actual height instead of duplicating an estimated height in the scroll container.

When persistence of the action is not required, prefer normal-flow Flexbox placement instead.

### 6. Text must be allowed to reflow

Do not scale application typography directly in proportion to viewport width or height.

Use the established typography tokens and allow layout to adapt around them.

For text inside horizontal Flexbox rows, use `flexShrink: 1` and `minWidth: 0` on the owning copy container where needed.

Do not fix clipping by arbitrarily reducing font size.

User-facing copy must remain usable with system text-size/accessibility scaling. Truncation is acceptable only when the product semantics explicitly allow it.

### 7. Responsive width is based on available space, not device names

Do not branch on an iPhone or Android model name.

Use available layout/window dimensions only when the layout genuinely changes at a width boundary. Prefer natural Flexbox behavior before adding breakpoints.

Keep large-screen content bounded with the existing `MaxContentWidth` convention rather than stretching cards indefinitely.

### 8. Keyboard behavior is part of responsive behavior

On forms, the active field and primary completion action must remain reachable when the software keyboard is open.

Use the appropriate combination of scrolling, keyboard avoidance, automatic keyboard insets, and focus handling for the surface.

Do not compensate for keyboard height using guessed fixed margins.

### 9. Touch targets remain usable while layout compresses

Do not make interactive hit areas smaller merely to fit a narrow viewport.

Keep suitable minimum control size or use `hitSlop` for compact icon affordances.

### 10. Preserve visual hierarchy during remediation

Responsive remediation must not silently redesign unrelated product behavior.

Preserve routes, actions, persistence, IDs, synchronization, ordering, and the existing dark visual language unless the task explicitly changes them.

Fix container behavior first; change individual visual dimensions only when the component itself is the problem.

## Validation matrix

Every materially changed screen should be checked against the following states when the available tooling permits it:

- narrow phone width;
- short phone height;
- modern iPhone safe areas;
- Android system navigation inset;
- increased system text size;
- long localized copy;
- software keyboard open for forms;
- empty state;
- populated state;
- last scroll item visible above floating/sticky controls.

Source/CI validation does not replace physical-device release evidence.

## Initial audit — 2026-08-08

The first audit found that safe-area usage already exists on many key screens, but bottom-navigation clearance was not represented by one contract.

Observed examples on `main` before RUI-1:

- Home, Progress, Coach, and Profile used `safeAreaInsets.bottom + 120` independently.
- Nutrition used only `insetsBottom + 24`, which could leave content under the floating tab bar.
- Workouts combined `BottomTabInset`, another fixed `+84`, and a separately inset absolute footer.
- Several text-heavy horizontal rows did not explicitly allow text shrink/wrap.

RUI-1 started remediation by adding shared floating-tab geometry and moving the first primary surfaces onto it. RUI-2 completed Home/Progress primary-tab geometry and made `LiquidGlassTabBar` consume the same shared metrics.

## Remediation inventory

### RUI-1 — foundation

**Complete and merged in PR #459.**

Shared navigation geometry, primary Workouts sticky-action geometry, Nutrition/Profile/Coach clearance, and the initial responsive contract are in `main`.

### RUI-2 — primary tab screens

**Complete and merged in PR #460.**

Home and Progress use the shared floating-tab clearance and bounded text/row reflow; the floating tab implementation consumes the same shared geometry constants.

### RUI-3A — active Workout Session + Finish

**Complete and merged in PR #462.**

The active-session audit identified a fixed 358 px set-table width that exceeded the content area on common narrow phones. RUI-3A retained 358 px as the preferred maximum while allowing Previous/weight/reps columns to compress proportionally.

The Finish audit identified an independent `176` px scroll-padding guess for an absolute footer. RUI-3A measures the rendered footer and reserves its actual height, and uses keyboard avoidance so completion actions remain reachable while editing.

Exact-head Mobile CI #1836 passed line audits, TypeScript, **1392/1392 tests**, expanded sync smoke, Expo export and Expo Doctor.

### RUI-3B — remaining workout creation/detail flows

**Implemented on `ui/rui3-workout-creation`; exact-head CI pending.**

Current remediation:

- Exercise Library preserves `FlatList` and measures the actual absolute Add footer rather than guessing `insets.bottom + 128`;
- Exercise Library search and rows are keyboard/text-pressure aware;
- Program workout picker uses a bounded `FlatList` instead of unbounded `.map()` rendering;
- New Routine uses keyboard-aware scrolling and bounded header/exercise/action copy;
- New Routine exercise picker virtualizes up to 100 candidate exercises with `FlatList` instead of a vertical `ScrollView` + `.map()`;
- Workout Builder and its editor modal use keyboard-aware scrolling and bounded/wrapping header/action rows;
- workout builder exercise action controls may wrap rather than force one horizontal line;
- Program Detail only receives the long-name/Add Routine/toast fixes its audit requires;
- Exercise Detail was audited and already meets the current safe-area/bounded-width/two-line-title requirements, so no unrelated redesign was added.

No workout/program persistence, save/discard, ordering, routing, synchronization or completed-history semantics are changed by RUI-3B.

### RUI-4 — auth, onboarding, profile/settings and Nutrition forms

**Next after RUI-3B.**

Audit all form screens for:

- keyboard reachability;
- Safe Area ownership;
- short-height scrolling;
- large-text wrapping;
- action-button reachability.

### RUI-5 — secondary Coach/Social/Progress surfaces

Audit remaining non-primary screens for the same contract after the high-frequency flows are stable.

### RUI-6 — automated regression guardrails

After the remediation inventory is sufficiently clean, add narrowly scoped source/interaction checks for proven failure patterns. Do not introduce a regex-based CI rule that falsely prohibits legitimate fixed component dimensions or legitimate overlay positioning.

## Definition of done

Responsive UI hardening is complete when:

- primary and secondary screens follow this contract;
- known magic-number navigation clearances are removed from active product surfaces;
- sticky actions reserve scroll space and account for safe areas/navigation overlays;
- long text and accessibility text sizing do not break key actions or data rows;
- forms remain usable with the keyboard open;
- potentially long collections are virtualized with bounded viewport ownership;
- narrow/short viewport checks pass;
- physical-device evidence is collected when release validation is explicitly authorized.
