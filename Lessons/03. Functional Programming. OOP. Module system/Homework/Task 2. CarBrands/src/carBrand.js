class CarBrand {
    constructor(model, power, acceleration) {
        this.model = model;
        this.power = power;
        this.acceleration = acceleration;
    }

    runDrag(time){
        return `${this.brandName()} ${this.model} runs drag for ${time} seconds`;
    }

    getWhoIsFaster(car) {
        const diff = Math.abs(this.acceleration - car.acceleration);
        const fasterCar = this.acceleration < car.acceleration ? this : car;
        return `${fasterCar.brandName()} ${fasterCar.model} is faster for ${diff} seconds`;
    }

    brandName() {
        return 'Car';
    }
}

export default CarBrand;