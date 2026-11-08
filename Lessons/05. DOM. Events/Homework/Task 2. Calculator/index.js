const TYPES = {
    DIGIT: 'digit',
    PLUS: 'plus',
    RESULT: 'result',
    RESET: 'reset',
};

const ADDITIONAL_BUTTONS = [
    {
        text: '+',
        type: TYPES.PLUS,
    },
    {
        text: '=',
        type: TYPES.RESULT,
    },
    {
        text: 'Сбросить',
        type: TYPES.RESET,
    },
];

const setCalculator = () => {
    const main = document.querySelector('.calc__main');
    const buttonsContainer = document.querySelector('.calc__buttons');
    const resultContainer = document.querySelector('.calc__result');

    // создаем кнопки 0-9
    for (let i = 0; i <= 9; i++) {
        const btn = document.createElement('button');
        btn.classList.add('btn', 'btn-dark');
        btn.textContent = String(i);
        btn.dataset.type = TYPES.DIGIT;
        buttonsContainer.append(btn);
    }

    // cоздаем доп кнопки
    for (const item of ADDITIONAL_BUTTONS) {
        const btn = document.createElement('button');
        btn.classList.add('btn', 'btn-dark');
        btn.textContent = item.text;
        btn.dataset.type = item.type;
        buttonsContainer.append(btn);
    }

    // создаем блок с результатом
    const resultText = document.createElement('span');
    resultText.textContent = 'Результат:';

    const resultNumber = document.createElement('span');
    resultNumber.classList.add('calc__result-number');
    resultNumber.textContent = '0';

    resultContainer.append(resultText, resultNumber);

    // логика
    const onButtonClick = (event) => {
        const button = event.target;
        const type = button.dataset.type;

        if (type === TYPES.DIGIT || type === TYPES.PLUS) {
            main.textContent += button.textContent;
        } else if (type === TYPES.RESET) {
            main.textContent = '';
            resultNumber.textContent = '0';
        } else if (type === TYPES.RESULT) {
            const sum = main.textContent
                .split('+')
                .map(Number)
                .reduce((acc, num) => acc + num, 0);

            resultNumber.textContent = String(sum);
        }
    };

    buttonsContainer.addEventListener('click', onButtonClick);
};

export default setCalculator;
