## Package.json и зачем он нужен

`package.json` описывает проект: его имя, поддерживаемую версию Node.js, зависимости и
служебные команды. Установленные версии фиксируются в `yarn.lock`, поэтому в курсе следует
устанавливать зависимости так:

```bash
yarn install --frozen-lockfile
```

Yarn скачивает пакеты из npm registry в каталог `node_modules`. Этот каталог не нужно
редактировать или добавлять в Git.

### Основные команды курса

Команды находятся в секции `scripts` корневого `package.json`:

```json
{
  "scripts": {
    "watch": "vite",
    "build": "vite build",
    "type-checker": "vue-tsc --noEmit --preserveWatchOutput",
    "lint": "oxlint --type-aware .",
    "lint:fix": "oxlint --type-aware --fix .",
    "test": "vitest run",
    "test-watch": "vitest"
  }
}
```

Запуск данных команд выполняется через Yarn:

```bash
yarn watch
yarn build
yarn lint
yarn test "Lessons/05."
```

### Dependencies и devDependencies

- `dependencies` — пакеты, которые нужны коду приложения во время работы;
- `devDependencies` — инструменты разработки, сборки, проверки типов и тестирования.

В этом проекте зависимости закреплены точными версиями, а полное дерево пакетов фиксирует
lock-файл. В других проектах версия вида `^3.2.4` может разрешать совместимые обновления
без изменения мажорной версии. Подробнее: [семантическое
версионирование](https://docs.npmjs.com/about-semantic-versioning) и [описание
package.json](https://docs.npmjs.com/cli/configuring-npm/package-json).
