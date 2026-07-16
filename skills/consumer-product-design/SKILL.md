---
name: consumer-product-design
summary: Project-specific design standard for smart-fitness-app’s consumer-grade UI direction.
---
# Consumer Product Design — smart-fitness-app
Use this skill for any UI, IA, copy, layout, or screen-redesign work in `smart-fitness-app`.
## 1) Product identity
The app should feel:
- focused
- calm
- athletic
- premium
- data-informed
- native to iPhone
- understandable to a first-time user
Avoid:
- admin-dashboard appearance
- card-everywhere layouts
- neon/gaming aesthetics
- excessive gradients
- fake AI framing
- technical jargon
- dense analytics without explanation
- management tools mixed with daily workflows
## 2) Core UX rules
Enforce:
- one screen, one primary job
- one dominant CTA above the fold
- no more than 2–3 competing actions in the hero area
- management features live in secondary routes
- lists for detailed content
- cards only for meaningful summaries/highlights
- progressive disclosure for advanced analytics
- destructive actions require confirmation
- empty states show one clear next action
- technical/debug content is hidden from ordinary users
If a screen feels like a dashboard, it is probably too crowded.
## 3) Navigation
Primary tabs must use:
- Home
- Workouts
- Nutrition
- Progress
- Profile
Do not use:
- AI Coach
- Labs
- Track
- Eat
Each main tab must define one primary purpose, one main CTA, no more than 3 initial content groups, and secondary drill-down routes for management-heavy features.
Use segmented controls only for peer modes inside a single tab, not as a second navigation system.
## 4) Visual system
Use:
- current dark theme unless explicitly changed
- one main accent color
- semantic color tokens
- restrained borders
- whitespace before extra containers
- consistent spacing scale
- readable iPhone typography
- 44x44 minimum tap targets
- 48px preferred for primary controls
Icon sizes:
- 16 inline/meta
- 20 list rows
- 24 navigation and major actions
- 28+ only for hero/empty states
Avoid arbitrary screen-local colors and spacing. Prefer a clean system-native look over decorative styling.
## 5) Component selection rules
Before creating a card, ask:
- Is this a summary or highlighted state?
- Could this be a section, list row, or plain grouped content instead?
Use:
- cards for summaries
- list rows for programs, workouts, foods, settings
- segmented controls for two peer modes
- bottom sheets for secondary choices
- dedicated routes for builders/editors/history/details
- sticky CTA for the main action when appropriate
Do not place builders, libraries, history, analytics and daily actions on one screen. Do not create a card just to hold a single row.
## 6) Screen-specific rules
### Home
- one daily decision surface
- one primary CTA
- compact summary
- no dashboard sprawl
### Workouts
- Start Now / Programs
- starting a workout is primary
- library, builder and history are secondary routes
### Nutrition
- diary first
- meal sections and Add Food are primary
- food library/search is a secondary flow
### Progress
- summary first
- drill-down for weight, measurements, PRs and muscle analytics
- do not show zero-filled analytics to fresh users
### Profile
- account
- goals
- sync/backup
- preferences
- developer settings collapsed and secondary
### Auth
- short benefit-led copy
- one submit CTA
- field-level errors
- no raw backend errors or technical wording
## 7) States
Every redesigned screen/component must consider:
- fresh user
- returning user
- loading
- offline
- error
- empty
- disabled
- destructive confirmation
Do not render multiple empty cards on one screen. Do not hide the only useful action inside an empty state.
## 8) Accessibility
Require:
- Dynamic Type compatibility where practical
- VoiceOver order matching visual order
- meaningful labels for icon-only controls
- no color-only status communication
- chart text summaries
- errors near fields
- minimum touch target compliance
- Reduce Motion-safe behavior
If a pattern is visually clear but not verbally clear, fix it.
## 9) Reference usage
Reference principles from:
- Apple Human Interface Guidelines
- Apple first-party apps
- Apple Design Award winners/finalists
- Lyfta
- Hevy
- Strong
- Gentler Streak
- The Outsiders
- MacroFactor
- FatSecret
Do not:
- copy assets
- copy exact layouts
- copy branding
- claim a pattern is Apple-required when it is only a recommendation
- invent observations about app versions not actually inspected
Use references for principles, not for cloning.
## 10) Agent workflow
Before changing UI:
- identify the screen's primary job
- identify the primary CTA
- list what should move to secondary routes
- reuse existing business logic
- inspect relevant existing components only
- avoid broad repository scans
After changing UI:
- verify hierarchy
- verify fresh-user state
- verify small-iPhone ergonomics
- verify accessibility
- run `npx tsc --noEmit`
- run `npm test`
- run `git diff --check`
Do not run `npm run lint` unless explicitly requested. Do not auto-install ESLint. Do not add dependencies without approval.
## 11) Required pre-implementation output
For any major screen redesign, before editing code the agent must briefly state:
- primary user job
- proposed section order
- primary CTA
- functionality moved to secondary routes
- preserved business logic
- files expected to change
Then proceed unless a real ambiguity or scope violation requires approval.
## 12) Implementation posture and checklist
Prefer small, surgical changes.
Prefer:
- one clear entry point per job
- reusable shared primitives
- minimal visual variation between similar screens
- native patterns over custom interactions
Avoid:
- multi-purpose mega screens
- "everything on the home tab"
- decorative empty sections
- broad layout rewrites without a reason
Before shipping a UI change, confirm:
- first viewport explains the screen instantly
- primary CTA is obvious
- secondary actions stay secondary
- screen works on a small iPhone
- tutorial copy is not required
- errors are recoverable
- empty states are useful
- debug/admin content is hidden
If any answer is no, simplify.
## 13) Project-specific reminders
- This app is a fitness consumer product, not a back-office tool.
- The approved redesign direction is calm, premium, and iPhone-native.
- Workouts, Nutrition, Progress, and Profile each need a single main job.
- Heavy management belongs in deeper routes.
- Do not reintroduce AI/Labs framing into the primary nav.
