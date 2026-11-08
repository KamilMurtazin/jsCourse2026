const LIGHTS = {
    red: {
        type: 'red',
        text: 'Красный',
    },
    yellow: {
        type: 'yellow',
        text: 'Желтый',
    },
    green: {
        type: 'green',
        text: 'Зеленый',
    },
};

const resetLights = () => {
    const container = document.querySelector('.traffic__lights-container');
    const spans = container.querySelectorAll('span');
    for (const span of spans){
        span.className = '';
    }
};

const setLight = (type) => {
    resetLights();
    const container = document.querySelector('.traffic__lights-container');
    const spans = container.querySelectorAll('span');

    let index = 0;
    if (type === 'yellow') index = 1;
    if (type === 'green') index = 2;

    spans[index].classList.add(`${type}-light`);
};

const setTrafficLight = () => {
    const lightsContainer = document.querySelector('.traffic__lights');
    const selectContainer = document.querySelector('.traffic__lights-select');
    //делаем светофор
    const container = document.createElement('div');
    container.classList.add('traffic__lights-container');

    //создаем 3 кружка
    const redSpan = document.createElement('span');
    const yellowSpan = document.createElement('span');
    const greenSpan = document.createElement('span');

    container.append(redSpan, yellowSpan, greenSpan);
    lightsContainer.append(container);

    //создаем select
    const select = document.createElement('select');
    select.classList.add('form-select');

    for (const key in LIGHTS) {
        const option = document.createElement('option');
        option.value = LIGHTS[key].type;
        option.textContent = LIGHTS[key].text;
        select.append(option);
    }

    selectContainer.append(select);

    setLight('red');

    //обработчик изменения select
    select.addEventListener('change', (event) => {
        const selectedValue = event.target.value;
        setLight(selectedValue);
    });
};

export default setTrafficLight;
