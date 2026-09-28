const convertToBinary = num => (num >>> 0).toString(2);

const getHammingWeight = (num) => {
    const binaryStr = convertToBinary(num);

    let count = 0;
    for (let i = 0; i < binaryStr.length; i++){
        if (binaryStr[i] === '1'){
            count++;
        }
    }
    return count;
};

export default getHammingWeight;
