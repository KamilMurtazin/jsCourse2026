const getLastWordLength = (str) => {
    const trimmed = str.trim();
    if (trimmed === ''){
        return 0;
    }

    const words = trimmed.split(' ');

    return words[words.length - 1].length;
};

export default getLastWordLength;
