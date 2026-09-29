# Ocean autonomous priority

Until the Ocean/Aquarium acceptance gates are all PASS, the autonomous controller selects the highest-priority safely actionable unmet gate from `docs/ocean-acceptance.md`. It re-evaluates those gates after every approved-scope merge from current `main`.
