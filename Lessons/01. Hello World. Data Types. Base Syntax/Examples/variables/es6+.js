// let допускает новое присваивание; const — нет.
const name = 'Justine';
let surname = 'Henin';
surname = 'Sharapova';
console.log(name + ' ' + surname); // Justine Sharapova

// const не запрещает изменение содержимого массива.
const letters = ['a', 'b', 'c'];
letters[3] = 'e';
console.log(letters.length); // 4

// let и const имеют блочную область видимости.
{
    const topic = 'Переменные';
    console.log(topic); // Переменные
}

// Намеренно ошибочные примеры ниже закомментированы.
// Раскомментируйте ОДИН пример, запустите и объясните ошибку.
// После необработанной ошибки оставшаяся часть выполнения останавливается.

// Пример 1: повторное присваивание const.
// name = 'Maria'; // TypeError

// Пример 2: чтение имени вне блока.
// console.log(topic); // ReferenceError

// Пример 3: временная мёртвая зона (TDZ).
// {
//     console.log(message); // ReferenceError: до инициализации
//     let message = 'Готово';
// }
