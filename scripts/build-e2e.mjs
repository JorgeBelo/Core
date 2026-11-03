import { spawnSync } from 'node:child_process';
// Isolated artifact. Test URL and key are never copied into the application .env.
const result = spawnSync(
  'pnpm --filter @core/mobile exec expo export --platform web --output-dir ../../work/e2e-web',
  {
    shell: true,
    stdio: 'inherit',
    env: {
      ...process.env,
      EXPO_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54329',
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'public-ui-test-fixture-only',
    },
  },
);
process.exit(result.status ?? 1);
