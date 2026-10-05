import CarBrand from './carBrand';

class LadaBrand extends CarBrand {
    constructor(model, power, acceleration, location) {
        super(model, power, acceleration);
        this.location = location;
    }

    brandName() {
        return 'Lada';
    }

    getLocation() {
        return `Lada ${this.model} is located in ${this.location}`;
    }
}

export default LadaBrand;