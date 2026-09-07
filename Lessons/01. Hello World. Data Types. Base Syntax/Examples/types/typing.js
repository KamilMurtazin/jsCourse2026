// Тип есть у значения, а переменная может получать значения разных типов.
let value;
console.log(typeof value); // undefined
value = 'Justine';
console.log(typeof value); // string
value = 42;
console.log(typeof value); // number
value = true;
console.log(typeof value); // boolean

// Преобразование определяется правилами операции.
console.log(4 + '2'); // 42 — строка
console.log('4' + 2); // 42 — строка
console.log(4 + Number('2')); // 6 — число
console.log(Number('')); // 0
console.log(Number(null)); // 0
console.log(String(42)); // 42 — строка

// Строгое/нестрогое сравнение.
console.log(4 === 2); // false
console.log(false === false); // true
console.log({} === {}); // false
console.log(42 === '42'); // false
console.log(4 == 2); // false
console.log(1 == true); // true
console.log(0 == false); // true
console.log({} == {}); // false
console.log(42 == '42'); // true

// Свойство length читается без скобок, метод вызывается со скобками.
const names = ['Justine'];
console.log(names.length); // 1
const text = 'Alex';
console.log(text.length); // 4
console.log(text[0]); // A
console.log(text.toUpperCase()); // ALEX
console.log(text); // Alex — исходная строка не изменилась
console.log((7).toString()); // 7 — строка

// Дополнительно: оболочка имеет тип object, примитив — number.
const num = 42;
const wrappedNum = new Number(42);
console.log(typeof num); // number
console.log(typeof wrappedNum); // object

// Необязательный разбор: +'a' даёт NaN, конкатенация — baNaNa.
const banana = ('b' + 'a' + +'a' + 'a').toLowerCase();
console.log(banana); // banana
