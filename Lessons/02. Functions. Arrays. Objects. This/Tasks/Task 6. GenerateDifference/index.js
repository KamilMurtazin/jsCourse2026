// Возвращает копию элемента
const getCopy = (el) => JSON.parse(JSON.stringify(el));

// Возвращает массив без дубликатов
const onlyUnique = (array) => [ ...new Set(array) ];

const generateDifference = (objOne, objTwo) => {
    const keysOne = Object.keys(objOne);
    const keysTwo = Object.keys(objTwo);
    const allKeys = onlyUnique([... keysOne, ... keysTwo]);

    const result = {};

    for (const key of allKeys) {
        const inOne = key in objOne;
        const inTwo = key in objTwo;

        if (inOne && !inTwo){
            result[key] = 'deleted';
        } else if (!inOne && inTwo){
            result[key] = 'added';
        } else {
            const valueOne = JSON.stringify(getCopy(objOne[key]));
            const valueTwo = JSON.stringify(getCopy(objTwo[key]));

            if (valueOne === valueTwo){
                result[key] = 'unchanged';
            } else {
                result[key] = 'changed';
            }
        }
    }
    return result;
};

export default generateDifference;
