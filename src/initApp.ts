import { createApp } from 'vue';
import LessonApp from './views/LessonApp.vue';
import './assets/index.css';
import 'highlight.js/styles/github.css';

let dispose: (() => void) | undefined;
/** Mount once; callers may dispose the app before mounting it elsewhere. */
export default function initApp({ vueAppSelector = '#vue-app' } = {}) {
    const root = document.querySelector(vueAppSelector);
    if (!root) {
        throw new Error(`Не найден контейнер приложения: ${vueAppSelector}`);
    }
    dispose?.();
    const app = createApp(LessonApp);
    app.mount(root);
    dispose = () => app.unmount();
    return dispose;
}
if (import.meta.hot) {
    import.meta.hot.dispose(() => dispose?.());
}
