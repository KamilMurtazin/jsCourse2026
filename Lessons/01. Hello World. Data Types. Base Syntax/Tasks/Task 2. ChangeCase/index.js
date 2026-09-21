const changeCase = (str) => {
    let result = '';

    for (let i = 0; i < str.length; i ++){
        const char = str[i];

        if (char === char.toUpperCase()){
            result += char.toLowerCase();
        } else {
            result += char.toUpperCase();
        }
    }
    return result;
};

export default changeCase;
