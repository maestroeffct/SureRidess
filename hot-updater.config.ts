import { existsSync } from 'node:fs';
import { bare } from '@hot-updater/bare';
import { s3Storage } from '@hot-updater/aws';
import { standaloneRepository } from '@hot-updater/standalone';
import { defineConfig } from 'hot-updater';

// Only used by the `hot-updater deploy`/`console` CLI on a dev machine (or
// CI) — never bundled into the app. Keep real credentials out of git; see
// .env.hotupdater.example for what to fill in.
if (existsSync('.env.hotupdater')) {
  process.loadEnvFile('.env.hotupdater');
}

const managementToken = process.env.HOT_UPDATER_AUTH_TOKEN;
if (!managementToken) {
  throw new Error(
    'HOT_UPDATER_AUTH_TOKEN is required — copy .env.hotupdater.example to .env.hotupdater and fill it in',
  );
}

export default defineConfig({
  build: bare({ enableHermes: true }),
  // Must match the storage plugin configured on the server
  // (sureride-backend/src/modules/ota/hotUpdater.ts) — both use s3Storage
  // pointed at the same Cloudflare R2 bucket.
  storage: s3Storage({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    bucketName: process.env.R2_BUCKET_NAME!,
  }),
  database: standaloneRepository({
    baseUrl:
      process.env.HOT_UPDATER_SERVER_URL ??
      'https://sureride-backend.onrender.com/hot-updater',
    commonHeaders: {
      Authorization: `Bearer ${managementToken}`,
    },
  }),
  updateStrategy: 'appVersion',
});
