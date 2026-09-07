console.log(Math.E); // 2.718281828459045
console.log(Math.PI); // 3.141592653589793
console.log(Math.abs(-42)); // 42
console.log(Math.sqrt(81)); // 9
console.log(Math.floor(2.7)); // 2
console.log(Math.ceil(2.1)); // 3
console.log(Math.round(2.7)); // 3
console.log(Math.trunc(-2.7)); // -2
console.log(Math.floor(-2.7)); // -3

// Значение меняется между запусками, но всегда принадлежит [0, 1).
const randomValue = Math.random();
console.log(randomValue >= 0 && randomValue < 1); // true
