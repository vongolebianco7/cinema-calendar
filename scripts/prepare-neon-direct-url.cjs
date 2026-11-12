#!/usr/bin/env node
'use strict';

const fs = require('node:fs');

const rawUrl = process.env.DATABASE_URL;
const envFile = process.env.GITHUB_ENV;
if (!rawUrl) throw new Error('DATABASE_URL is required');
if (!envFile) throw new Error('GITHUB_ENV is required');

let databaseUrl;
try {
  databaseUrl = new URL(rawUrl);
} catch {
  throw new Error('DATABASE_URL is not a valid URL');
}
if (!['postgres:', 'postgresql:'].includes(databaseUrl.protocol)) {
  throw new Error('DATABASE_URL must use the postgres protocol');
}

// Prisma schema synchronization is a one-off CLI operation. Use Neon’s direct
// endpoint for it; serverless application connections keep their existing URL.
if (databaseUrl.hostname.endsWith('.neon.tech')) {
  databaseUrl.hostname = databaseUrl.hostname.replace(/-pooler(?=\\.c-)/, '');
  if (databaseUrl.hostname.includes('-pooler.')) {
    throw new Error('Could not resolve the Neon pooler hostname to its direct endpoint');
  }
}

fs.appendFileSync(envFile, `DATABASE_URL=${databaseUrl.toString()}\\n`, { mode: 0o600 });
