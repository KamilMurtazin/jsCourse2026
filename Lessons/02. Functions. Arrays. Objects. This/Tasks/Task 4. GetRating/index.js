const getRating = (object) => {
    const { likes, dislikes } = object;

    return likes - dislikes;
};

export default getRating;
