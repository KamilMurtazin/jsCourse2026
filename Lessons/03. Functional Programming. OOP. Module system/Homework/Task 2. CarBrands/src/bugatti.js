import CarBrand from './carBrand';

class BugattiBrand extends CarBrand {
    constructor(model, power, acceleration, price) {
        super(model, power, acceleration);
        this.price = price;
    }
    brandName() {
        return 'Bugatti';
    }

    getIsExpensive(){
        return this.price > 1;
    }
}

export default BugattiBrand;