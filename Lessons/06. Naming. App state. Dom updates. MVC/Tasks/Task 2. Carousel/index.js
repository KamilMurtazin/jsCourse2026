// Метод для инициализации DOM приложения
const initDOM = (state) => {
    const inner = document.querySelector('.carousel-inner');

    state.imageUrls.forEach((url, index) => {
        const item = document.createElement('div');
        // если индекс совпадает с активным, сразу даем класс active
        if (index === state.activeIndex) {
            item.classList.add('carousel-item', 'active');
        } else {
            item.classList.add('carousel-item');
        }

        const img = document.createElement('img');
        img.classList.add('d-block', 'w-100');
        img.src = url;

        item.append(img);
        inner.append(item);
    });
};

// Метод для ререндера приложения
const render = (activeImageIndex) => {
    const items = document.querySelectorAll('.carousel-item');

    items.forEach((item, index) => {
        if (index === activeImageIndex) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
};

// Метод определения обработчиков событий в приложении
const addListeners = (state) => {
    const btnPrev = document.querySelector('.carousel-control-prev');
    const btnNext = document.querySelector('.carousel-control-next');

    btnNext.addEventListener('click', () => {
        if (state.activeIndex === state.imageUrls.length - 1) {
            state.activeIndex = 0;
        } else {
            state.activeIndex += 1;
        }
        render(state.activeIndex);
    });

    btnPrev.addEventListener('click', () => {
        if (state.activeIndex === 0) {
            state.activeIndex = state.imageUrls.length - 1;
        } else {
            state.activeIndex -= 1;
        }
        render(state.activeIndex);
    });
};

// Приложение
const setCarousel = (imageUrls) => {
    const state = {
        imageUrls: imageUrls,
        activeIndex: 0,
    };

    initDOM(state);
    addListeners(state);
};

export default setCarousel;