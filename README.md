# Smart Fitness App

Clean Expo MVP scaffold for a fitness tracking app.

## Current MVP

- Home dashboard with calories, protein, body weight, last workout, and start workout action.
- Workouts screen with mock routines and exercises.
- Nutrition screen with macro totals and food entries.
- Progress screen with weight history and body measurement mocks.
- Profile screen with basic height, weight, goal, and activity level fields.
- AsyncStorage is used only as temporary local storage.

## Run

```bash
npm install
npx expo start
```

## Food API

Set `EXPO_PUBLIC_FOOD_API_BASE_URL` to enable backend-proxied food search. If it is missing, the app keeps using the existing local nutrition catalog.

Do not add FatSecret client ids or client secrets to Expo environment variables. FatSecret credentials live only in `smart-fitness-backend`; the app consumes normalized backend `FoodItem` responses and never calls FatSecret directly. Preserve attribution for provider food data where applicable, do not cache FatSecret data permanently unless terms allow it, and do not redistribute FatSecret as a standalone database.
