const setCounter = () => {
    const main = document.querySelector('.main');
    const button = document.createElement('button');

    button.classList.add('btn', 'btn-warning');

    let count = 0;
    button.textContent = `Количество нажатий: ${count}`;

    button.addEventListener('click', () => {
        count += 1;
        button.textContent = `Количество нажатий: ${count}`;
    });

    main.append(button);
};

export default setCounter;