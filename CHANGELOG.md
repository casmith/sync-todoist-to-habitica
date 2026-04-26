# Changelog

## [1.1.3](https://github.com/casmith/sync-todoist-to-habitica/compare/todoist-habitica-v1.1.2...todoist-habitica-v1.1.3) (2026-04-26)


### Bug Fixes

* **deps:** bump axios from 1.15.1 to 1.15.2 ([#145](https://github.com/casmith/sync-todoist-to-habitica/issues/145)) ([e99b317](https://github.com/casmith/sync-todoist-to-habitica/commit/e99b31729300575ec051b4cac2f530398da7aaa9))

## [1.1.2](https://github.com/casmith/sync-todoist-to-habitica/compare/todoist-habitica-v1.1.1...todoist-habitica-v1.1.2) (2026-04-21)


### Bug Fixes

* unwrap paginated results in todoist listProjects ([e99df61](https://github.com/casmith/sync-todoist-to-habitica/commit/e99df61b15a2ebc509ff689f542c5b694882890d))

## [1.1.1](https://github.com/casmith/sync-todoist-to-habitica/compare/todoist-habitica-v1.1.0...todoist-habitica-v1.1.1) (2026-04-21)


### Bug Fixes

* error due to lodash still being imported ([4e23131](https://github.com/casmith/sync-todoist-to-habitica/commit/4e231317d4c104d16954791eb5346fd67e0bf223))

## [1.1.0](https://github.com/casmith/sync-todoist-to-habitica/compare/todoist-habitica-v1.0.0...todoist-habitica-v1.1.0) (2026-04-21)


### Features

* add dependabot ([0584a81](https://github.com/casmith/sync-todoist-to-habitica/commit/0584a8198d70b61df288cb622b1fcb12936aabba))
* add support for setting credentials via environment variables ([f794cbf](https://github.com/casmith/sync-todoist-to-habitica/commit/f794cbfbfe2967cbe2b49d3d0f4efc98065a91d6))
* always log the sync token ([b9902ec](https://github.com/casmith/sync-todoist-to-habitica/commit/b9902ec0bed848898bd4fe567b419bbbc3cbdc7d))
* conditionally load config ([7160a1e](https://github.com/casmith/sync-todoist-to-habitica/commit/7160a1edd059e4595c792f76e25def822185416f))
* implement frequency parsing for remaining recurring task patterns ([#130](https://github.com/casmith/sync-todoist-to-habitica/issues/130)) ([e304a81](https://github.com/casmith/sync-todoist-to-habitica/commit/e304a81055dcadc4e2af0d900fbdc53f1823e46a)), closes [#121](https://github.com/casmith/sync-todoist-to-habitica/issues/121)
* log last run sync token ([04da039](https://github.com/casmith/sync-todoist-to-habitica/commit/04da039f0b7ea038c5511e0b9340aa2eccec54c2))
* make daily goal task name configurable ([f04c51e](https://github.com/casmith/sync-todoist-to-habitica/commit/f04c51e0c7bdc32ca93e0c09a31745711f8fbe23)), closes [#106](https://github.com/casmith/sync-todoist-to-habitica/issues/106)
* migrate Todoist API from v9/v2 to v1 ([#84](https://github.com/casmith/sync-todoist-to-habitica/issues/84)) ([e4e8fd2](https://github.com/casmith/sync-todoist-to-habitica/commit/e4e8fd2ef33464bc1b9dd5d143a6202ecf8b4aa6))
* print lastRun after initial token is set ([554adef](https://github.com/casmith/sync-todoist-to-habitica/commit/554adefce5b696aec151151b172c1bec25c86ac8))
* print out lastRun ([aeadcfb](https://github.com/casmith/sync-todoist-to-habitica/commit/aeadcfb81ed47e28be4014b47ad1f6c59fe83b20))
* publish date-based version ([4d9703c](https://github.com/casmith/sync-todoist-to-habitica/commit/4d9703cb579fb038f602c8db561dfeb38c8f573b))
* replace preemptive 2s sleeps with 429 retry-after handling ([e0de581](https://github.com/casmith/sync-todoist-to-habitica/commit/e0de581d6dc8fc8a68c6ade0b279f9f6ba536183))
* separate clean-up pr workflow ([699e217](https://github.com/casmith/sync-todoist-to-habitica/commit/699e217d725576b742cbdbdbeb5adaf6b85c5a23))
* support initial sync token from command line ([e296a51](https://github.com/casmith/sync-todoist-to-habitica/commit/e296a5125904eceb5dba11fffbd441bd9e69ee48))
* support unmatched daily task via environment var ([870aca6](https://github.com/casmith/sync-todoist-to-habitica/commit/870aca62a9acd7ec0fa1e6139b7f208ba31a6d58))


### Bug Fixes

* **#23:** fix task getting deleted on rename ([edbbc5c](https://github.com/casmith/sync-todoist-to-habitica/commit/edbbc5ce643041fe91315871eda53ae98d2c5bea))
* add error handling to axios calls with concise error messages ([343c793](https://github.com/casmith/sync-todoist-to-habitica/commit/343c793ea870548255780030f6b384cf31a212d3))
* add sleep before updating tasks in habitica to prevent rate limiting ([5611dec](https://github.com/casmith/sync-todoist-to-habitica/commit/5611dec86507770e6ec92b95e1678a4530b95277))
* append git short hash to Docker tag to avoid overwrites ([0974c88](https://github.com/casmith/sync-todoist-to-habitica/commit/0974c88807ae93619cb3bdc4df2378ee6438da07))
* bad return ([31379a0](https://github.com/casmith/sync-todoist-to-habitica/commit/31379a0d8906bf51f9d62a0876f41f9cddc74bcb))
* **deps:** bump jsonfile from 6.2.0 to 6.2.1 ([#141](https://github.com/casmith/sync-todoist-to-habitica/issues/141)) ([4ab7de0](https://github.com/casmith/sync-todoist-to-habitica/commit/4ab7de09b5de038901b08803ea3e7b762066c46f))
* handle Todoist 5xx errors gracefully to avoid failed k8s cronjobs ([#127](https://github.com/casmith/sync-todoist-to-habitica/issues/127)) ([9c11e1b](https://github.com/casmith/sync-todoist-to-habitica/commit/9c11e1ba453b4ab3eeafe96aaa278f15c5df4a0e))
* make logging work properly when updating a task ([9435dfb](https://github.com/casmith/sync-todoist-to-habitica/commit/9435dfb127b72a9adf838eec1ab19b941cdf7217))
* override serialize-javascript to ^7.0.3 to resolve RCE vulnerability (GHSA-5c6j-r48x-rmvq) ([2b80334](https://github.com/casmith/sync-todoist-to-habitica/commit/2b8033404d55a70e2bcdad0ba5e4f4c7b7fb4d59))
* preserve original error context in habitica.js _requestError ([#125](https://github.com/casmith/sync-todoist-to-habitica/issues/125)) ([#137](https://github.com/casmith/sync-todoist-to-habitica/issues/137)) ([e4ec48d](https://github.com/casmith/sync-todoist-to-habitica/commit/e4ec48d122be9129097196054e0b71789b97ab6f))
* remove console.log calls that expose credentials and API data ([34f1463](https://github.com/casmith/sync-todoist-to-habitica/commit/34f1463165c74c0fe20ecfb2432b369fafdeaf9a)), closes [#101](https://github.com/casmith/sync-todoist-to-habitica/issues/101)
* replace console.log/warn calls with Winston logger in sync.js ([5cc31ef](https://github.com/casmith/sync-todoist-to-habitica/commit/5cc31efed07918aeeab2d69613e91d79ee87f792)), closes [#118](https://github.com/casmith/sync-todoist-to-habitica/issues/118)
* set tag for PR branches ([abf0dc0](https://github.com/casmith/sync-todoist-to-habitica/commit/abf0dc04eab8aaece8a3167eae28c5ad5e4e8d71))
