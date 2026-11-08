const setToDo = () => {
    const main = document.querySelector('.to-do__main');
    const tasks = document.querySelector('.to-do__tasks');

    // создаем поле ввода
    const input = document.createElement('input');
    input.classList.add('form-control', 'form-control-lg');
    input.type = 'text';

    // создаем кнопки
    const planButton = document.createElement('button');
    planButton.classList.add('btn', 'btn-danger');
    planButton.textContent = 'Добавить в план';

    const completedButton = document.createElement('button');
    completedButton.classList.add('btn', 'btn-success');
    completedButton.textContent = 'Добавить в сделанные';


    main.append(input, planButton, completedButton);

    // Вспомогательная функция для добавления задачи
    const addTask = (type) => {
        const span = document.createElement('span');
        span.textContent = input.value;
        span.dataset.type = type;

        // Обработчик удаления задачи
        span.addEventListener('click', () => {
            span.remove();
        });

        tasks.append(span);
        input.value = ''; // Очищаем поле ввода
    };

    // навешиваем события на кнопки
    planButton.addEventListener('click', () => {
        addTask('planned');
    });

    completedButton.addEventListener('click', () => {
        addTask('completed');
    });
};

export default setToDo;