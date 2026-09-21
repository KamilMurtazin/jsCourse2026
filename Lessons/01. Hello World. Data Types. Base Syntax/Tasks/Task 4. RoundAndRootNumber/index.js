// степень округления числа
const ROUNDING_DEGREE = 100;

const roundAndRootNumber = (num) => {
    if (num < 0){
        return 'error';
    }

    const sqrt = Math.sqrt(num);
    const rounded = Math.floor(sqrt * ROUNDING_DEGREE)/ ROUNDING_DEGREE;

    return String(rounded)
};

export default roundAndRootNumber;
