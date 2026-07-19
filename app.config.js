const { expo } = require('./app.json');

// INTERNAL TESTING ONLY.
// Set this to false before any public App Store build or commercial release.
const enableOssExerciseDb = true;

module.exports = () => ({
  ...expo,
  extra: {
    ...expo.extra,
    enableOssExerciseDb,
  },
});
