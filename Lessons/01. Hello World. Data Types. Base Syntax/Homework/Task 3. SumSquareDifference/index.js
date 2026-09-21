const sumSquareDifference = (num) => {

    let sum = 0;
    let sumOfSquares = 0;

    for (let i = 1; i <= num; i++){
        sum += i;
        sumOfSquares += i ** 2;
    }

    return sum ** 2 - sumOfSquares;
};

export default sumSquareDifference;