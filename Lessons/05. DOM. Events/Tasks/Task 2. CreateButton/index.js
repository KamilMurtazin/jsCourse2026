const createButton = () => {
    const container = document.querySelector('.button-container');
    const description = document.querySelector('.description ');

    const button = document.createElement('button');
    button.classList.add('btn', 'btn-primary');
    button.textContent = 'Кнопка';

    button.addEventListener('click', () => {
        const span = document.createElement('span');
        span.textContent = 'Текст вставлен!';
        description.append(span);
    });

    container.append(button);
};

export default createButton;
