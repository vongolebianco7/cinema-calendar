# Real fish PoC asset provenance

- Asset: `fish-real.png`
- Subject: Killi fish (Cynolebias sp.), aquarium photograph with background removed
- Author: Julian G
- Source: Wikimedia Commons, `File:Transparent killifish.png`
- License: Public domain / PD-self
- Source page: https://commons.wikimedia.org/wiki/File:Transparent_killifish.png
- Original raster: 711 x 359 PNG, approximately 303 KB
- Runtime policy: the source is downloaded once at build/authoring time and committed locally. Production makes zero requests to Wikimedia.

## Milestone creature atlas v2

- Asset: `optimized/milestone-creatures-v2.webp`
- Subjects: clownfish, sea turtle, seahorse, ocean sunfish, giant octopus, manta ray, bottlenose dolphin, hammerhead shark, large shark, dugong, minke/baleen whale, orca, humpback whale, whale shark, blue whale.
- Source: generated specifically for Cinemap Ocean with OpenAI image generation on 2026-09-30, then cropped/optimized into a local transparent WebP atlas.
- Purpose: replace the crude geometric milestone SVGs and species substitutions with immediately recognizable, high-detail milestone animals.
- Runtime policy: committed locally; production makes zero external image requests.
- Composition policy: each species has a unique crop in `milestone-assets.json`; no generic fish body or another species may be substituted.

## Ordinary reef species expansion v1

- Existing exact-species photo: `optimized/species-madai.webp` is retained for マダイ; the catalog label is promoted from the generic `マダイ系` to `マダイ`.
- New local assets: `species-blue-tang.svg`, `species-firefish.svg`, `species-sixline-wrasse.svg`, `species-damselfish.svg`, `species-lyretail-anthias.svg`, `species-filefish.svg`.
- Subjects: ナンヨウハギ, ハタタテハゼ, ニセモチノウオ, スズメダイ, アカネハナゴイ, カワハギ.
- Source: original vector artwork authored specifically for Cinemap Ocean in-repository; no third-party image is embedded and no runtime network request is made.
- Purpose: give each approved ordinary species a distinct silhouette and color identity instead of recoloring one shared fish.
- Runtime policy: all assets are committed locally. Production makes zero external image requests.
- Motion policy: `ordinary-species-motion.js` assigns species-specific lightweight motion profiles while keeping the 500-creature hybrid renderer intact.

The realism floor remains: if the iPhone first impression reads as an icon/game sprite rather than a recognizable marine animal, the asset gate fails and the milestone must not ship.
