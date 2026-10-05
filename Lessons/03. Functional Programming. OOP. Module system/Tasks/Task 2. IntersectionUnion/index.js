const getIntersectionUnion = (arr1, arr2) => {
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);

    const intersection = [...set1].filter((item) => set2.has(item));

    const union = [...new Set([...arr1, ...arr2])];

    return { intersection, union };
};

export default getIntersectionUnion;
