const { expo } = require('./app.json');

const enableOssExerciseDb = process.env.EXPO_PUBLIC_ENABLE_OSS_EXERCISEDB === 'true';

module.exports = () => ({
  ...expo,
  extra: {
    ...expo.extra,
    enableOssExerciseDb,
  },
});
