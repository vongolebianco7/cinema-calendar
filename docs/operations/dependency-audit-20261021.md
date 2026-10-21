# Reproducible dependency and link audit — 2026-10-21

`backend/package-lock.json` resolves the existing, unchanged manifest ranges into124exact npm package records, including optional platform binaries. Every record has a registry.npmjs.org HTTPS URL, integrity metadata and a license expression. The inventory records each version, source URL and integrity. It does not attest which packages were installed in an earlier production deployment.

An isolated checkout installed the exact lock with `npm ci --ignore-scripts --no-audit --no-fund`, then passed the existing `prisma generate && next build` with telemetry disabled and an unused localhost database URL. No DB push, data import, production credential or external movie API call was used. Measured build versions were Next16.4.2, React19.3.1 and Prisma6.19.3. The new read-only backend CI repeats this build and preserves the inventory artifact.

The shared quality gate fails when the lock no longer matches dependency ranges, a package has no exact version/license metadata, or registry URL/integrity evidence is absent. Four regressions cover exact inventory, missing license/untrusted source, manifest drift and preservation of complex-license review flags.

License counts from npm metadata: MIT78; Apache-2.0 25; LGPL-3.0-or-later10; Apache-2.0 AND LGPL-3.0-or-later AND MIT1; Apache-2.0 AND LGPL-3.0-or-later3; CC-BY-4.0 1; BSD-3-Clause2; BSD-2-Clause1; ISC2; 0BSD1. The15complex or non-permissive expressions remain explicitly listed for manual review. This is source inventory evidence, not legal clearance, a permission grant, or assurance about uploaded artwork, trademarks or distribution obligations.

The companion static-link report checked all16external URLs emitted as static HTML attributes in the published artifact. Each received one HEAD request,8-second timeout,4workers, no body scraping and no retry. All16returned HTTP200 on2026-10-21. Combined with0missing static local references, the current bounded link audit is complete. Dynamic JavaScript/data URLs and future changes are outside that observation; a reachable page does not establish reuse rights.

P0-01.3's missing reproducible dependency/license inventory and bounded link evidence are addressed when this branch passes CI and integrates. P0-04.3 and P1-09.2 source/artwork/legal questions remain separate and unresolved; no blanket legal compliance claim is made.
