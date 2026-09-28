const getBudget = (people) => {
    return people.reduce((acc, person) => {
        return acc + person.budget;
    }, 0);
};

export default getBudget;
