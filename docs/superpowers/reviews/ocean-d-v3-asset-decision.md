# D-v3 asset sourcing decision

External CC0 packs were considered, but the first visual gate uses project-authored image sprites instead.

Reason: the first question is whether image-composited art can preserve D's smoothness while escaping primitive Canvas geometry. Self-authored sprites give deterministic provenance, zero runtime requests, and no dependency on an external pack's game-art style. If iPhone G2 still fails, replace only these images with a more naturalistic CC0/owned set; retain the compositor, caching, growth and performance work.

This is deliberately not an assertion that the current art is visually approved. Human iPhone G1/G2 is binding.
