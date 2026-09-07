// Исторический синтаксис: var имеет область функции, но не блока for.
function logDate() {
    for (var i = 0; i < 10; i += 1) {
        var text = 'i = ' + i;
    }
    console.log(text); // i = 9
}
logDate();

// Объявление var учитывается заранее; присваивание остаётся на своём месте.
function logBeforeAssignment() {
    console.log(text); // undefined
    var text = 'Готово';
    console.log(text); // Готово
}
logBeforeAssignment();
