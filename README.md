# todoist-habitica-sync

[![codecov](https://codecov.io/gh/casmith/sync-todoist-to-habitica/branch/master/graph/badge.svg?token=ODO5BC1ZEP)](https://codecov.io/gh/casmith/sync-todoist-to-habitica)

A utility for syncing todoist tasks to habitica.

This is not created by, affiliated with, or supported by Doist.

## Requirements

- A modern node.js version (tested with 10.x, 11.x)
- A todoist account
- A habitica account

## Usage

```shell
$ git clone git@github.com:casmith/todoist-habitica-sync.git
$ cd todoist-habitica-sync/
$ npm install
$ cp config.json.example config.json # edit config.json with your favorite editor and add the habitica and todoist api credentials
$ node index.js
```

That's it! You can configure it to run on a schedule with something like crontab.

## Orphaned task handling

Habitica tasks created by this sync may become "orphaned" if their corresponding
Todoist task disappears outside the sync window (for example, deleted directly
in Todoist while the sync wasn't running, or after a sync token reset). On every
run, any habitica task whose alias does not match a current Todoist task is
logged as a warning so you can review it.

To automatically act on orphans, set `habiticaOrphanAction` in `config.json` or
the `HABITICA_ORPHAN_ACTION` environment variable to one of:

- `log` (default) — only log the orphans
- `score` — score them in Habitica (treats them as completed)
- `delete` — delete them from Habitica

### Legacy Todoist ID migration

Older Todoist task IDs were short numeric strings; current ones are base32. For
habitica tasks created before the switchover, the alias still holds the legacy
ID and Todoist's API no longer exposes any link between the two. To bridge the
gap, on every sync the script tries to migrate legacy aliases by exact content
match: when one habitica task with a legacy alias and one unaliased Todoist task
share identical text, the habitica alias is rewritten to the new ID. Legacy
aliases whose content doesn't match any active Todoist task are flagged as
orphans with a `legacy alias couldn't be migrated... candidate for deletion`
note — those are habitica tasks whose Todoist counterpart is gone (deleted or
completed outside the sync window) and you'll likely want to clean them up.
Legacy aliases whose content matches more than one active Todoist task are
left alone (we can't tell which is which).

## License

```
This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <http://unlicense.org/>
```
