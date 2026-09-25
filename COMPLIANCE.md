# CINEMA DAYS Compliance Policy

CINEMA DAYS treats legal compliance, source terms, and intellectual-property rights as a release gate.

## Core rule

Do not implement a data source merely because it is technically accessible.

Before adding or expanding any source, confirm that the intended use is permitted. If permission is unclear, do not automate collection from that source.

## Source checklist

For every new external source, review:

- Official API availability and API terms
- Website terms of service / terms of use
- robots.txt and published crawler guidance
- Attribution requirements
- Commercial vs non-commercial restrictions
- Reproduction / redistribution restrictions
- Rate limits and reasonable request frequency
- Whether storing the data in our own database is permitted
- Whether displaying excerpts, ratings, reviews, images, or metadata is permitted
- Whether the source requires a link back or other credit

Prefer, in order:

1. Official API
2. Official downloadable/open data
3. Official pages where automated access is clearly permitted
4. Manual/curated sourced data

If none of the above is clearly allowed, do not automate collection.

## Copyright and content reuse

- Do not reproduce full reviews, criticism, articles, or other copyrighted text.
- Use minimal factual summaries and link to the original source.
- Do not republish third-party images unless their use is permitted.
- Do not infer or fabricate facts, release dates, versions, relationships, or citations.
- Store provenance for sourced claims whenever practical.

## Movie relationships / criticism

For influence, homage, remake, source material, version differences, restoration history, and critical interpretation:

- Prefer primary sources such as interviews, official production notes, distributor materials, archives, or rights-holder statements.
- Secondary sources may be used when reputable and clearly attributed.
- Every non-obvious relationship should retain source name and source URL.
- AI-generated similarity alone must not be presented as a factual relationship.

## Streaming and theater data

- Prefer official provider APIs and official schedules.
- Do not bypass authentication, paywalls, anti-bot measures, or technical access controls.
- Do not increase crawl frequency beyond what is reasonably necessary.
- If a provider prohibits automated collection, exclude that provider rather than work around the restriction.

## Third-party review services

For services such as Filmarks, where CINEMA DAYS does not have an explicit data-use agreement or licensed API:

- Do not scrape ratings, rankings, review counts, reviews, or proprietary metadata.
- Do not cache or store those ratings or rankings in CINEMA DAYS.
- Do not reproduce or rebuild the service's ranking product.
- Do not use third-party logos unless their trademark guidelines expressly permit it.
- A normal text link to the service's public page/search may be used where appropriate.
- If an official licensed API or written permission becomes available, perform a fresh compliance review before using any data.

## Reviews and ratings

- Do not scrape or republish user reviews or proprietary ratings unless the source explicitly permits it.
- Prefer outbound links to the relevant title page when reuse rights are unclear.

## Operational requirement

A new source is not production-ready until its compliance review is complete.

When terms change or a source requests removal, disable the integration promptly and retain only data we are permitted to keep.

## Priority

When product completeness conflicts with compliance, compliance wins.


## Automated source registry

Production automation must consult `data/source_registry.json`.

- `approved`: may be used by automated production workflows, subject to listed requirements.
- `link_only`: may only be referenced through ordinary outbound links; no scraping, caching, or republication.
- `disabled`: must not be used for automated collection or republication.

Automated workflows must pass `scripts/check_sources.py` before collecting production data. Changing a source from `disabled` or `link_only` to `approved` requires a fresh compliance review and documented legal/contractual basis.


## Zero-cost / non-commercial release gate

CINEMAP is operated as a personal, non-commercial project. Paid APIs, metered paid add-ons, advertising, subscriptions, purchases, donations, affiliate monetization, and any feature that can create an automatic usage charge are out of scope.

Before enabling a service or feature in production, confirm all of the following:

- It is permitted for personal, non-commercial use.
- The enabled plan has no automatic paid overage for the feature being used.
- No paid API key or paid AI/model endpoint is required.
- Required attribution and branding are present.
- Automated collection, caching, storage, display, and redistribution are permitted for the exact intended use.
- Copyrighted artwork is not exported or redistributed beyond the permission actually granted.
- No authentication, paywall, anti-bot measure, or technical access control is bypassed.
- No personal, payment, password, or other sensitive user data is collected.

If any item is unclear, keep the integration disabled until the terms or permission are confirmed.

### Hosting constraints

- GitHub Pages must remain within its permitted project-hosting use and must not be used as a commercial SaaS/e-commerce host.
- Vercel Hobby must remain personal and non-commercial. CINEMAP must not opt into paid plans or paid overage features.
- Hitting a free-tier limit is treated as a service-availability event, not a reason to enable billing automatically.

### Generative AI

Production CINEMAP must not require OpenAI or another paid generative-AI API. The concierge may use deterministic parsing and approved free data APIs only unless this policy is explicitly changed after a fresh cost/compliance review.

### Social exports

Do not embed third-party movie posters or other copyrighted artwork in user-generated social export images unless redistribution rights for that exact use have been verified. In-app reference/display and export/republication are treated as separate uses.
