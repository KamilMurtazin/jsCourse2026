<script setup lang="ts">
import { computed, nextTick, watch } from 'vue';
import hljs from 'highlight.js/lib/common';
import { useCourse } from '../utils/useCourse';

const {
    lessons, lesson, taskId, tasks, task, query, group, filteredTasks, source, description, lessonDescription,
    loading, loadError, input, inputError, status, duration, logs, visibleLogs, frame, frameUrl, runId, slow,
    presentation, activeLine, walkthrough, lineNote, notice, logFilter, lines, lineCount, isNode, testCommand, filePath,
    chooseLesson, chooseTask, loadSelection, run, stop, frameLoaded, moveTask, moveLine, saveNote, copy,
} = useCourse();
const statusText = computed(() => ({
    idle: 'Выберите задачу', loading: 'Загрузка', running: 'Выполняется…',
    done: task.value?.type === 'js' ? 'Вызов завершён' : 'Страница загружена',
    error: 'Ошибка', stopped: 'Остановлено', node: 'Нужен Node.js',
}[status.value]));
const position = computed(() => tasks.value.findIndex(item => item.id === taskId.value));
const highlightedLines = computed(() => lines.value.map(line =>
    hljs.highlight(line, { language: task.value?.type === 'js' ? 'typescript' : 'xml', ignoreIllegals: true }).value || ' '));
const domTask = computed(() => task.value?.type === 'js'
    ? tasks.value.find(item => item.directory === task.value?.directory && item.type === 'html' && !item.id.endsWith('Example'))
    : undefined);
const copyLink = () => copy(window.location.href);
watch(activeLine, async () => {
    if (!walkthrough.value) return;
    await nextTick();
    document.querySelector(`[data-line="${activeLine.value}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
});
</script>

<template>
    <div class="course" :class="{ 'is-presenting': presentation }">
        <a class="skip-link" href="#workspace">К заданию</a>
        <header class="topbar">
            <a class="brand" href="./index.html" aria-label="Frontend практикум, главная">
                <span class="brand-icon" aria-hidden="true">&lt;/&gt;</span>
                <span>frontend<span class="brand-dot">.</span> <small>практикум</small></span>
            </a>
            <div class="topbar-context">Курс разработки <span>/</span> 2 курс</div>
            <button class="button" :aria-pressed="presentation" @click="presentation = !presentation">
                {{ presentation ? 'Выйти из показа · Esc' : 'Режим показа' }}
            </button>
        </header>

        <aside class="sidebar" aria-label="Навигация по курсу">
            <div class="sidebar-title"><span class="eyebrow">ПРОГРАММА КУРСА</span><span class="count">{{ lessons.length }}</span></div>
            <label for="lesson-selector">Текущий урок</label>
            <select id="lesson-selector" :value="lesson" @change="chooseLesson(($event.target as HTMLSelectElement).value)">
                <option value="">Выберите урок</option>
                <option v-for="entry in lessons" :key="entry.id" :value="entry.id">{{ entry.id }}</option>
            </select>
            <template v-if="lesson">
                <button class="lesson-overview" :class="{ active: !taskId }" @click="chooseTask('')">↗ Материалы урока</button>
                <label class="search-label" for="task-search">Найти задачу</label>
                <input id="task-search" v-model="query" type="search" placeholder="Название задачи…" />
                <div class="segmented" aria-label="Тип задания">
                    <button :aria-pressed="group === 'all'" @click="group = 'all'">Все</button>
                    <button :aria-pressed="group === 'Tasks'" @click="group = 'Tasks'">Практика</button>
                    <button :aria-pressed="group === 'Homework'" @click="group = 'Homework'">Домашние</button>
                </div>
                <div class="task-list-label"><span>ЗАДАЧИ</span><span>{{ filteredTasks.length }} / {{ tasks.length }}</span></div>
                <nav class="task-list" aria-label="Задачи урока">
                    <button v-for="item in filteredTasks" :key="item.id" class="task-item"
                        :class="{ active: item.id === taskId }" :aria-current="item.id === taskId ? 'page' : undefined"
                        @click="chooseTask(item.id)">
                        <span class="task-number">{{ String(item.num).padStart(2, '0') }}</span>
                        <span class="task-item-info"><strong>{{ item.title.replace(/^Task \d+\. /, '') }}</strong>
                            <small>{{ item.group === 'Tasks' ? 'Практика' : 'Домашняя работа' }} <span>· {{ item.extension.toUpperCase() }}</span></small>
                        </span>
                    </button>
                </nav>
                <p v-if="!filteredTasks.length" class="muted empty-search">Задач не найдено. Измените название или фильтр.</p>
            </template>
            <div class="sidebar-footer"><span class="local-dot"></span> Решения — в вашем редакторе<br><small>Сохраните файл, чтобы увидеть изменения.</small></div>
        </aside>

        <main id="workspace" class="workspace">
            <div class="breadcrumb"><span>Учебная мастерская</span><span v-if="lesson">/</span><span v-if="lesson">Урок {{ lesson.split('.')[0] }}</span><span v-if="task">/</span><span v-if="task">{{ task.group === 'Tasks' ? 'Практика' : 'Домашняя работа' }}</span></div>
            <div class="workspace-heading">
                <div><p class="eyebrow">{{ task ? 'ПРАКТИКА В КОДЕ' : 'ОТ ТЕОРИИ К ПРАКТИКЕ' }}</p>
                    <h1>{{ task ? task.title.replace(/^Task \d+\. /, '') : lesson || 'Начнём с первого запуска' }}</h1>
                    <p class="subtitle">{{ task ? 'Прочитайте условие. Измените код. Посмотрите результат.' : 'Условия, ваш код и результат — в одном месте.' }}</p>
                </div>
                <div v-if="task" class="task-navigation">
                    <button class="icon-button" aria-label="Предыдущая задача" :disabled="position <= 0" @click="moveTask(-1)">←</button>
                    <span>{{ position + 1 }} <span class="muted">/ {{ tasks.length }}</span></span>
                    <button class="icon-button" aria-label="Следующая задача" :disabled="position >= tasks.length - 1" @click="moveTask(1)">→</button>
                </div>
            </div>

            <div v-if="notice" class="toast" role="status">{{ notice }}</div>
            <div v-if="loading" class="notice" role="status">Загружаем материалы…</div>
            <div v-else-if="loadError" class="notice error" role="alert">{{ loadError }} <button class="button" @click="loadSelection">Повторить загрузку</button></div>

            <section v-if="!lesson" class="welcome panel">
                <span class="welcome-mark" aria-hidden="true">{ }</span>
                <h2>Маленькая задача. Новый навык.</h2>
                <p>Выберите урок и задачу слева. Приложение само запустит решение и покажет, что получилось.</p>
                <div class="welcome-steps">
                    <div><b>01</b><h3>Разберитесь</h3><p>Прочитайте условие и примеры.</p></div>
                    <div><b>02</b><h3>Попробуйте</h3><p>Напишите решение в редакторе.</p></div>
                    <div><b>03</b><h3>Проверьте</h3><p>Сравните результат и запустите тесты.</p></div>
                </div>
                <button class="button primary" @click="chooseLesson(lessons[0]?.id ?? '')">Открыть первый урок →</button>
            </section>

            <section v-else-if="!task" class="panel lesson-material">
                <div class="panel-heading"><h2>Материалы урока</h2><span class="badge">{{ tasks.length }} задач</span></div>
                <div class="prose" v-html="lessonDescription"></div>
                <p v-if="!loading && !tasks.length" class="notice">В этом уроке пока нет задач для запуска.</p>
            </section>

            <template v-else-if="!loading && !loadError">
                <div class="workspace-tools">
                    <div class="task-kind"><span class="language-dot"></span>{{ task.extension.toUpperCase() }} <span class="muted">· автозапуск при выборе</span></div>
                    <div class="toolbar-buttons">
                        <button class="text-button" @click="copy(filePath)">Копировать путь</button>
                        <button class="text-button" @click="copyLink">Ссылка на задачу ↗</button>
                    </div>
                </div>
                <div class="study-grid">
                    <section class="panel instructions">
                        <div class="panel-heading"><h2><span class="section-number">01</span> Условие</h2><span class="muted">README.md</span></div>
                        <div class="prose" v-html="description"></div>
                        <details class="test-help">
                            <summary>Как проверить решение тестами</summary>
                            <p>В терминале проекта выполните:</p>
                            <code class="command">{{ testCommand }}</code>
                            <button class="text-button" @click="copy(testCommand)">Копировать команду</button>
                            <p class="muted">Завершённый запуск сам по себе не означает, что задача решена верно.</p>
                        </details>
                    </section>

                    <div class="execution-column">
                        <section class="panel source-panel">
                            <div class="panel-heading">
                                <h2><span class="section-number">02</span> Ваш код</h2>
                                <button class="button small" :aria-pressed="walkthrough" @click="walkthrough = !walkthrough">{{ walkthrough ? 'Закончить разбор' : 'Разбор по строкам' }}</button>
                            </div>
                            <div class="file-strip"><span aria-hidden="true">≡</span><code :title="filePath">{{ filePath.split('/').slice(-2).join('/') }}</code><span>{{ lineCount }} строк</span></div>
                            <div class="code-scroll" :class="{ 'has-walkthrough': walkthrough }" aria-label="Исходный код">
                                <button v-for="(line, index) in highlightedLines" :key="index" class="code-line" :data-line="index + 1"
                                    :class="{ selected: walkthrough && activeLine === index + 1 }"
                                    :aria-label="`Строка ${index + 1}: ${lines[index]}`"
                                    :aria-pressed="walkthrough && activeLine === index + 1"
                                    @click="walkthrough = true; activeLine = index + 1">
                                    <span class="line-number" aria-hidden="true">{{ index + 1 }}</span><code v-html="line"></code>
                                </button>
                            </div>
                            <div v-if="walkthrough" class="walkthrough">
                                <div class="walkthrough-toolbar"><strong>Строка {{ activeLine }} <span class="muted">из {{ lineCount }}</span></strong>
                                    <div><button class="icon-button" aria-label="Предыдущая строка" :disabled="activeLine === 1" @click="moveLine(-1)">↑</button>
                                        <button class="icon-button" aria-label="Следующая строка" :disabled="activeLine === lineCount" @click="moveLine(1)">↓</button></div>
                                </div>
                                <label for="line-note">Заметка к строке <span class="muted">· сохраняется в этом браузере</span></label>
                                <textarea id="line-note" :value="lineNote" rows="2" placeholder="Что происходит на этой строке? Как изменится результат?"
                                    @input="saveNote(($event.target as HTMLTextAreaElement).value)"></textarea>
                                <p class="muted microcopy">Это разбор текста кода. Паузы выполнения и переменные доступны в DevTools.</p>
                            </div>
                            <form class="run-controls" @submit.prevent="run()">
                                <template v-if="task.type === 'js' && !isNode">
                                    <label for="task-arguments">Аргументы функции <span class="muted">· JSON через запятую</span></label>
                                    <input id="task-arguments" v-model="input" placeholder='Например: 42, "текст", [1, 2]' :aria-invalid="!!inputError" aria-describedby="arguments-help arguments-error" />
                                    <p id="arguments-help" class="muted microcopy">Пустое поле — payload из модуля или вызов без аргументов. Массив [1, 2] — один аргумент.</p>
                                    <p v-if="inputError" id="arguments-error" class="field-error" role="alert">{{ inputError }}</p>
                                </template>
                                <div v-if="isNode" class="notice">Эта задача использует Node.js. Проверяйте её в терминале:<code class="command">{{ testCommand }}</code></div>
                                <template v-else>
                                    <p v-if="domTask" class="microcopy">Нужны элементы страницы? <button type="button" class="text-button" @click="chooseTask(domTask.id)">Открыть HTML задачи ↗</button></p>
                                    <div class="run-actions"><button class="button primary" type="submit">▶ {{ status === 'running' ? 'Перезапустить' : 'Запустить' }}<kbd>Ctrl ↵</kbd></button>
                                        <button v-if="frameUrl" class="button" type="button" @click="stop()">Остановить</button>
                                        <button v-if="task.type === 'js'" class="text-button" type="button" @click="run(true)">Отладка</button>
                                    </div>
                                    <details v-if="task.type === 'js'" class="debug-help"><summary>Пошаговое выполнение в DevTools</summary>
                                        <p>Откройте инструменты разработчика (F12), затем нажмите «Отладка». Браузер остановится перед вызовом функции. Нажимайте F11 («Шаг внутрь»), чтобы войти в код задачи, F10 — для следующего шага, F8 — чтобы продолжить.</p>
                                        <p>Переменные находятся в Scope. Можно поставить точку останова непосредственно в файле задачи во вкладке Sources. Без открытых DevTools кнопка просто запускает код.</p>
                                    </details>
                                </template>
                            </form>
                        </section>

                        <section class="panel console-panel">
                            <div class="panel-heading"><h2><span class="section-number">03</span> Консоль</h2>
                                <button class="text-button" :disabled="!logs.length" @click="logs = []">Очистить</button>
                            </div>
                            <div class="console-status">
                                <span class="status" :class="status" role="status"><span></span>{{ statusText }}</span>
                                <span v-if="duration !== null" class="muted">{{ duration }} мс</span>
                                <label class="visually-hidden" for="log-filter">Фильтр консоли</label>
                                <select id="log-filter" v-model="logFilter"><option value="all">Все сообщения</option><option value="error">Ошибки</option><option value="warn">Предупреждения</option><option value="result">Результат</option></select>
                            </div>
                            <div v-if="slow" class="notice">Задача выполняется больше 10 секунд. Проверьте Promise, сеть или паузу отладчика. Можно остановить запуск.</div>
                            <div class="console-output" role="log" aria-label="Вывод программы" aria-live="polite">
                                <div v-for="entry in visibleLogs" :key="entry.id" class="log-row" :class="entry.level"><time>{{ entry.time }}</time><span class="log-level">{{ entry.level === 'result' ? '↳' : entry.level }}</span><pre>{{ entry.text }}</pre></div>
                                <p v-if="!visibleLogs.length" class="console-empty">{{ logs.length ? 'Нет сообщений с выбранным фильтром.' : 'Здесь появятся console.log, ошибки и результат функции.' }}</p>
                            </div>
                        </section>

                        <section v-if="task.type !== 'js'" class="panel preview-panel">
                            <div class="panel-heading"><h2>Результат на странице</h2><span class="badge">{{ task.extension.toUpperCase() }}</span></div>
                            <div id="preview-slot"></div>
                        </section>
                    </div>
                </div>
            </template>
            <div v-if="task && frameUrl" :class="task.type === 'js' ? 'script-frame' : 'frame-container'">
                <Teleport v-if="task.type !== 'js' && !loading" to="#preview-slot">
                    <iframe ref="frame" :key="runId" :src="frameUrl" title="Результат выполнения задачи" @load="frameLoaded"></iframe>
                </Teleport>
                <iframe v-else ref="frame" :key="runId" :src="frameUrl" title="Среда выполнения JavaScript" @load="frameLoaded"></iframe>
            </div>
        </main>
    </div>
</template>

