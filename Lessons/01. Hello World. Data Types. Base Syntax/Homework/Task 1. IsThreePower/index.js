const isThreePower = (num) => {
    if (num < 1){
        return false;
    }
    if (num === 1){
        return true;
    }
    while (num % 3 === 0){
        num = num / 3;
    }
    return num === 1
};

export default isThreePower;