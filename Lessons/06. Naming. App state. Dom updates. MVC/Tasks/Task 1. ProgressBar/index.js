const setWidth = (number) => {
    const bar = document.querySelector('.progress-bar');
    bar.style.width = `${number}%`;
};

const updateProgress = (defaultNumber, delta) => {
    let currentNumber = defaultNumber;
    const btnUp = document.querySelector('.button-increase');
    const btnDown = document.querySelector('.button-decrease');

    // ставим начальную ширину
    setWidth(currentNumber);

    btnUp.addEventListener('click', () => {
        currentNumber = currentNumber + delta;
        if (currentNumber > 100) {
            currentNumber = 100;
        }
        setWidth(currentNumber);
    });

    btnDown.addEventListener('click', () => {
        currentNumber = currentNumber - delta;
        if (currentNumber < 0) {
            currentNumber = 0;
        }
        setWidth(currentNumber);
    });
};

export default updateProgress;