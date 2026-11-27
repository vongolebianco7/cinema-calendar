import { bindings, defineConfig, defineWorker } from "cf/config";
import { createWorkersResponseStoreSelfContainedConfig } from "@vinext/cloudflare/cache/config";

export default defineConfig(async ({ isPreview }) => {
  const workerName = isPreview ? "cinelva-api-preview" : "cinelva-api";
  const bucketName = isPreview
    ? "cinelva-api-preview-cache-bodies"
    : "cinelva-api-response-store-cache-bodies";
  const cache = await createWorkersResponseStoreSelfContainedConfig({
    worker: workerName,
    bucket: bucketName,
  });

  return {
    worker: defineWorker({
      ...cache,
      name: workerName,
      entrypoint: "vinext/server/fetch-handler",
      compatibilityDate: "2026-11-24",
      compatibilityFlags: ["nodejs_compat", "nodejs_compat_populate_process_env"],
      assets: {
        htmlHandling: "none",
        notFoundHandling: "none",
        runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
      },
      env: {
        ...cache.env,
        ASSETS: bindings.assets(),
      },
    }),
  };
});
