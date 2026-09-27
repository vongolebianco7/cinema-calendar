from import_awards_wikidata_full_history_v2 import FAMILIES, main

# Avoid expensive label regex scans. Wikidata explicitly models the Cannes award
# family as Q28444913 and lists its award categories as instances/parts.
FAMILIES["カンヌ国際映画祭"] = (
    1946,
    "{ ?award wdt:P31 wd:Q28444913 } UNION { wd:Q28444913 wdt:P527 ?award } UNION { ?award wdt:P1027 wd:Q42369 }",
)

if __name__ == "__main__":
    main()
