const CHECK_NUM = 42;

const transformFortyTwo = (arr) => {
    return arr.map((num) =>{
        if (num % CHECK_NUM === 0){
            return 'forty two!'
        }
        return num;
    });
};

export default transformFortyTwo;
