# Cinema price maintenance

Initial factual review: 2026-10-25, six venues, ordinary adult 2D seats only. See each venue's sourceUrl in data/cinema_discounts.json for its primary tariff table. Facts were manually reviewed; no production crawling, internal cinema endpoints, source imagery, logos or copied descriptions. Conditions are original concise explanations.

The engine picks one eligible tariff, never stacks reductions. The member-card combined AEON tariff is an explicitly published standalone tariff, not a computed stacked discount. User benefit selection means an existing valid membership/qualifying card; membership acquisition, monthly/annual fees and transport costs are excluded, not advertised as free. No card numbers or account credentials are requested or stored. No affiliate links or tracking.

Check each venue's current official price page and all corresponding benefit conditions before updating numeric facts. Update verifiedAt only after actual review. Review at least every60 days and earlier on announced changes; the UI suppresses numbers both when current date exceeds that review interval and when selected future date exceeds it. This is an editorial review horizon, not a promise that tariffs remain unchanged for60 days. There is no automatic review timestamp refresh.

Sources:
- https://www.tohotheater.jp/theater/010/price.html
- https://www.tohotheater.jp/theater/036/price.html
- https://109cinemas.net/kawasaki/prices.html
- https://cinecitta.co.jp/price
- https://www.aeoncinema.com/kohoku/price/
- https://www.aeoncinema.com/minatomirai/price/
- https://www.saisoncard.co.jp/creditcard/benefits-service/saison-thursday/

Do not imply complete local coverage, movie availability, remaining seats or a nationwide minimum. Senior/student, paired tickets, points, individual coupons, special events, premium formats and seats are outside the comparison. Evening selection is a tariff condition, not a known available screening. Actual applicability and latest price are confirmed on the theater's own checkout. A late-show selection must not imply an eligible film exists.

The existing disabled109 automated source remains disabled. The new registry entry covers only this manual factual snapshot. Terms and permission for future automated showtimes remain a separate prerequisite.

## Nationwide method-first guide (2026-10-26)

The user rejected membership checkboxes and six local venues as the main experience. `chains` now contains13 nationally usable exhibitor/programme profiles and26 methods. The UI shows methods, fees, eligibility, steps, selected-date candidates and other eligible dates without visitor benefit preselection or preference storage. Registration-free and conditional ticket prices are separate. First-enrolment500-yen SMT tickets have their one-time, designated route, counter-only, expiry and548-yen automatic renewal conditions; they are never claimed as available to everyone. Programme sources do not establish a complete list of all discounts or all cinemas. All source summaries are factual and independently worded.

Primary manual review2026-10-26:
- https://www.tohotheater.jp/otoku/ (service days)
- https://entm.auone.jp/toho/aumonday/lpc (TOHO Ponta)
- https://www.saisoncard.co.jp/creditcard/benefits-service/saison-thursday/ (qualifying issuer/steps)
- https://www.toho-one.com/about/ (annual500-yen standard plan)
- https://help.fod.fujitv.co.jp/ (standard1320-yen plan, eligible course restrictions)
- https://www.aeoncinema.com/service/service_day/ (1200-yen Monday/first,1400-yen night and5 Monday exclusions)
- https://www.aeon.co.jp/card/lp/merit_aeoncinema/ (1100-yen designated cards, prior purchase and annual10 limit)
- https://109cinemas.net/images/theater/20260528/20260528price_all.pdf (2026-06-26 tariffs; service day1300–1400 range, premiumShinjuku excluded)
- https://help.tjoy.jp/faq/show/126?category_id=16&site_domain=default (service days, December distinction)
- https://www.cinemasunshine.co.jp/news/27/ (Wednesday1400; primary search index confirmed text, client-rendered page)
- https://entm.auone.jp/ (1400-yen national participating groups, exclusions, OS Wednesday1100)
- https://entm.auone.jp/smt/everyday/lpc (SMT regular/first-enrolment terms, monthly548)

No new automated acquisition permission. Existing disabled109 automation remains disabled. Historical6-venue `venues` facts and their original2026-10-25 review dates remain for backward-compatible pure-engine tests; they do not define the nationwide UI. Individual theater standard prices are not inferred from chain membership. National directory rows link to the relevant guide only for explicit brand matches; unrecognized cinemas retain existing official links. A selected named exclusion suppresses the related method. The directory snapshot itself is historical and does not certify current operation.
