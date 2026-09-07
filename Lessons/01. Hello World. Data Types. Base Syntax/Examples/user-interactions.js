// Только браузер: выполните пример в DevTools → Console.
// prompt возвращает строку или null. Проверяем отмену до обращения к trim().
const input = prompt('Сколько мест забронировать?');
if (input === null) {
    alert('Запись отменена');
} else if (input.trim() === '') {
    alert('Введите количество');
} else {
    const quantity = Number(input);
    if (!Number.isInteger(quantity) || quantity <= 0) {
        alert('Нужно целое положительное число');
    } else if (confirm(`Забронировать мест: ${quantity}?`)) {
        alert('Запись подтверждена');
    } else {
        alert('Запись отменена');
    }
}
// trim() убирает пробелы по краям; Number.isInteger() проверяет целое число.
// Проверьте отмену, пустой ввод, пробелы, abc, 0, 2.5 и 2 с подтверждением/отказом.
// Это демонстрация: реальные места она не сохраняет.
