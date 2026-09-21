const isTicketHappy = (numStr) => {

    const middle = numStr.length / 2;

    let sum1 = 0;
    let sum2 = 0;

    for (let i = 0; i < middle; i ++){
        sum1 += Number(numStr[i]);
    }
    for (let i = middle; i < numStr.length; i++){
        sum2 += Number(numStr[i]);
    }

    return sum1 === sum2;
};

export default isTicketHappy;
