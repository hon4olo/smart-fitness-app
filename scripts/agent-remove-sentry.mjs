import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const write = (file, content) => fs.writeFileSync(path.join(root, file), content);
const remove = (file) => {
  const target = path.join(root, file);
  if (fs.existsSync(target)) fs.rmSync(target);
};

const packageJson = JSON.parse(read('package.json'));
delete packageJson.dependencies['@sentry/react-native'];
delete packageJson.scripts['sentry:upload-sourcemaps'];
packageJson.dependencies['@expo/ui'] = '~56.0.24';
packageJson.dependencies.expo = '~56.0.18';
packageJson.dependencies['expo-router'] = '~56.2.17';
delete packageJson.expo;
write('package.json', `${JSON.stringify(packageJson, null, 2)}\n`);

const appJson = JSON.parse(read('app.json'));
appJson.expo.plugins = appJson.expo.plugins.filter(
  (plugin) => plugin !== '@sentry/react-native/expo',
);
write('app.json', `${JSON.stringify(appJson, null, 2)}\n`);

write(
  'metro.config.js',
  "const { getDefaultConfig } = require('expo/metro-config');\n\nmodule.exports = getDefaultConfig(__dirname);\n",
);

let layout = read('src/app/_layout.tsx');
layout = layout
  .replace("import { CrashReportContextBridge } from '@/observability/CrashReportContextBridge';\n", '')
  .replace(
    "import {\n  initializeCrashReporting,\n  wrapRootComponent,\n} from '@/observability/crashReporting';\n",
    '',
  )
  .replace('\ninitializeCrashReporting();\n', '\n')
  .replace('        <CrashReportContextBridge />\n', '')
  .replace('export default wrapRootComponent(RootLayout);', 'export default RootLayout;');
write('src/app/_layout.tsx', layout);

write(
  'src/observability/RootErrorFallback.tsx',
  `import * as Updates from 'expo-updates';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type RootErrorFallbackProps = {
  error: Error;
  retry(): void;
};

export function RootErrorFallback({ retry }: RootErrorFallbackProps) {
  const [restarting, setRestarting] = useState(false);

  const restart = async () => {
    if (restarting) return;
    setRestarting(true);
    try {
      await Updates.reloadAsync();
    } catch {
      setRestarting(false);
      retry();
    }
  };

  return (
    <View accessibilityRole="alert" style={styles.screen}>
      <View style={styles.card}>
        <Text selectable style={styles.eyebrow}>SMART FITNESS</Text>
        <Text selectable style={styles.title}>Something went wrong</Text>
        <Text selectable style={styles.body}>
          Your saved data has not been intentionally removed. Try reopening this screen or restart the app.
        </Text>
        <Pressable
          accessibilityRole="button"
          disabled={restarting}
          onPress={retry}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}>
          <Text style={styles.primaryButtonText}>Try again</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={restarting}
          onPress={() => void restart()}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}>
          {restarting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.secondaryButtonText}>Restart app</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    backgroundColor: '#000000',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  card: {
    backgroundColor: '#111111',
    borderColor: '#282828',
    borderRadius: 24,
    borderWidth: 1,
    maxWidth: 460,
    padding: 24,
    width: '100%',
  },
  eyebrow: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginBottom: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 34,
  },
  body: {
    color: '#B0B0B5',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    marginTop: 12,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#0A84FF',
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#3A3A3C',
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 10,
    minHeight: 50,
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.72,
  },
});
`,
);

for (const file of [
  'src/observability/CrashReportContextBridge.tsx',
  'src/observability/crashReporting.ts',
  'src/observability/crashReportingModel.ts',
  'src/observability/crashReportingModel.test.ts',
  'docs/release/crash-reporting.md',
  'ios/sentry.properties',
  'android/sentry.properties',
]) {
  remove(file);
}

let roadmap = read('ROADMAP_PROGRESS.md')
  .replace('- Privacy-safe crash-reporting source foundation complete.\n', '')
  .replace(
    '- release gate, staging, native builds, OTA lanes, Sentry, and device validation;\n',
    '- release gate, staging, native builds, OTA lanes, and device validation;\n',
  )
  .replace(
    '4. Configure Sentry/EAS values, select a compatible runtime, and verify source maps on preview devices.\n',
    '4. Complete the remaining release-device and offline-restart matrix on the working standalone runtime.\n',
  );
write('ROADMAP_PROGRESS.md', roadmap);

let release = read('docs/roadmap/release-and-account.md')
  .replace('Updated: 2026-07-25', 'Updated: 2026-07-30')
  .replace(
    '- privacy-safe Sentry integration, source-map wiring, Expo Doctor, and root error recovery are complete in mobile PR #96;\n',
    '- root error recovery and privacy-safe local diagnostics remain available without a third-party crash-reporting SDK;\n',
  )
  .replace('- configure Sentry and EAS environment values;\n', '')
  .replace(
    '- select a new runtime/app version and create matching iOS and Android builds;\n',
    '- the standalone iOS runtime 1.0.3 is working; create and validate the matching Android build;\n',
  )
  .replace('- verify native and EAS Update source maps with sanitized test events;\n', '')
  .replace(
    '- complete auth-refresh and API failure-category instrumentation without raw payloads.\n',
    '- complete privacy-safe local auth-refresh and API failure-category diagnostics without raw payloads.\n',
  );
write('docs/roadmap/release-and-account.md', release);

const quality = read('docs/roadmap/data-quality-and-scale.md')
  .replace(
    '- local Xcode source-map upload was disabled with the Scheme-only `SENTRY_DISABLE_AUTO_UPLOAD=true` setting, without adding production Sentry credentials or disabling the SDK in application code.\n',
    '',
  )
  .replace('and Sentry runtime stability;', 'and standalone runtime stability;');
write('docs/roadmap/data-quality-and-scale.md', quality);
