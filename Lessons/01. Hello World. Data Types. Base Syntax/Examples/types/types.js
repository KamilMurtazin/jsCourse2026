/*
 * Семь примитивных типов: undefined, boolean, number, string, bigint, symbol, null.
 * Восьмой тип — object; массивы и функции также объекты.
 * number: безопасные целые от -(2 ** 53 - 1) до 2 ** 53 - 1.
 * За пределами этого диапазона числа существуют, но соседние целые могут не различаться.
 * bigint: целые произвольной точности в пределах ресурсов среды, в том числе 1n.
 */
console.log(typeof 42); // number
console.log(typeof NaN); // number
console.log(typeof 42n); // bigint
console.log(typeof 'itis'); // string
console.log(typeof true); // boolean
console.log(typeof {}); // object
console.log(typeof null); // object — историческая особенность, null остаётся примитивом
console.log(typeof undefined); // undefined
console.log(typeof Symbol('name')); // symbol
console.log(typeof console.log); // function — функция относится к объектам

console.log(Number.MAX_SAFE_INTEGER); // 9007199254740991
console.log(0.1 + 0.2); // 0.30000000000000004
console.log(Number.isNaN(Number('не число'))); // true
console.log(1 / 0); // Infinity
