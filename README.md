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
