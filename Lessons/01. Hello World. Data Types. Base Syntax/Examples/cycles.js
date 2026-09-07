// for: начальное значение → условие → тело → шаг.
let total = 0;
for (let number = 1; number <= 4; number += 1) {
    total += number;
}
console.log(total); // 10

// continue пропускает вывод, break завершает цикл.
for (let number = 10; number < 42; number += 1) {
    if (number === 15) {
        continue;
    }
    if (number === 20) {
        break;
    }
    console.log(number);
}
// Вывод цикла: 10, 11, 12, 13, 14, 16, 17, 18, 19 — по одному числу на строке.

// while: условие проверяется до тела.
let number = 30;
while (number < 33) {
    console.log(number);
    number += 1;
}
// 30, 31, 32

// do...while: тело выполнится хотя бы один раз.
let otherNumber = 42;
do {
    console.log(otherNumber); // 42
    otherNumber += 1;
} while (otherNumber < 42);

// for...of и for...in — на следующем занятии.
