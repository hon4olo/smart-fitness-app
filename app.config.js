// INTERNAL TESTING ONLY.
// Set this to false before any public App Store build or commercial release.
const enableOssExerciseDb = true;

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    enableOssExerciseDb,
  },
});
