# Real fish PoC asset provenance

- Asset: `fish-real.png`
- Subject: Killi fish (Cynolebias sp.), aquarium photograph with background removed
- Author: Julian G
- Source: Wikimedia Commons, `File:Transparent killifish.png`
- License: Public domain / PD-self
- Source page: https://commons.wikimedia.org/wiki/File:Transparent_killifish.png
- Original raster: 711 x 359 PNG, approximately 303 KB
- Runtime policy: the source is downloaded once at build/authoring time and committed locally. Production makes zero requests to Wikimedia.

## Milestone creature atlas v3

- Asset: `optimized/milestone-creatures-v3.webp`
- Subjects: clownfish, sea turtle, ocean sunfish, giant octopus, manta ray, bottlenose dolphin, hammerhead shark, large shark, dugong, minke/baleen whale, orca, humpback whale, whale shark, blue whale.
- Source: generated specifically for Cinemap Ocean with OpenAI image generation, then cropped and optimized into a local transparent WebP atlas.
- Purpose: replace the earlier cut-and-paste-looking milestone sheet with more natural marine poses and more coherent photorealistic texture.
- Pose policy: manta, dolphin, dugong and other swimmers use neutral/natural swimming silhouettes; runtime motion moves the whole creature and does not permanently bend the atlas body.
- Runtime policy: committed locally; production makes zero external image requests and uses no paid or metered runtime image service.
- Composition policy: each approved species has a unique crop in `milestone-assets.json`; no generic fish body or another species may be substituted. The rejected seahorse is not part of the runtime milestone catalog.

## Ordinary reef species v1

- Assets: `optimized/species-blue-tang.svg`, `species-firefish.svg`, `species-sixline-wrasse.svg`, `species-damselfish.svg`, `species-lyretail-anthias.svg`, `species-filefish.svg`.
- Subjects: ナンヨウハギ, ハタタテハゼ, ニセモチノウオ, スズメダイ, アカネハナゴイ, カワハギ. マダイ continues to use the existing dedicated local `species-madai.webp` asset.
- Source: original vector illustrations authored specifically for Cinemap Ocean; no external copyrighted image is embedded or fetched at runtime.
- Purpose: give each approved ordinary species a distinct silhouette, palette and ecology role rather than recoloring one generic fish.
- Runtime policy: committed locally; production makes zero external image requests.

The realism floor remains: if the iPhone first impression reads as an icon/game sprite rather than a recognizable marine animal, the asset gate fails and the milestone must not ship.
