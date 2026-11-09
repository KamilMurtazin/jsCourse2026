import WatchJS from '../../helpers/melanke-watchjs.js';

const { watch } = WatchJS;

const setNewsMaker = () => {
    // 1. Состояние (Model)
    const state = {
        news: [],
    };

    const input = document.querySelector('.news__form input');
    const button = document.querySelector('.news__form button');
    const container = document.querySelector('.news__container');

    // 2. Отрисовка (View)
    const render = () => {
        container.innerHTML = '';

        state.news.forEach((item) => {
            const newsElement = document.createElement('div');
            newsElement.classList.add('news__news-element');

            const dateHeader = document.createElement('h5');
            dateHeader.textContent = item.date;

            const textDiv = document.createElement('div');
            textDiv.textContent = item.text;

            newsElement.append(dateHeader, textDiv);

            container.prepend(newsElement);
        });
    };

    // 3. Наблюдатель (Watcher)
    watch(state, 'news', () => {
        render();
    });

    // 4. Контроллер (Controller)
    button.addEventListener('click', () => {
        const text = input.value;

        if (!text.trim()) return;

        const now = new Date().toLocaleString();

        state.news.push({
            text: text,
            date: now,
        });

        input.value = '';
    });
};

export default setNewsMaker;