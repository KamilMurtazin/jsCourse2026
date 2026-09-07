const number = 7;

if (number > 10) {
    console.log('Число больше десяти');
} else if (number < 5) {
    console.log('Число меньше пяти');
} else {
    console.log('Число от пяти до десяти включительно');
}

// && — оба условия, || — хотя бы одно.
console.log(number > 5 && number < 10); // true
console.log(number < 5 || number > 10); // false
// number > 10 && number < 5 не подходит ни для одного числа.

// ! — логическое отрицание.
console.log(!true); // false
console.log(!!1); // true
console.log(!null); // true
console.log(!''); // true
console.log(Boolean('0')); // true
console.log('' || 'Гость'); // Гость
console.log('Itis' && 'Cool'); // Cool

// switch использует строгое сравнение с case.
const selectedNumber = 42;
switch (selectedNumber) {
    case 35:
        console.log('Число 35');
        break;
    case 52:
        console.log('Число 52');
        break;
    case 42:
        console.log('Число 42');
        break;
    default:
        console.log('Неизвестное число');
}
