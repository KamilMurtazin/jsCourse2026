class CityGame {
    constructor(player1, player2) {
        this.player1 = player1;
        this.player2 = player2;
        this.restart();
    }

    restart(){
        this.players = [this.player1, this.player2];
        this.currentPlayerIndex = 0;
        this.usedCities = [];
        this.isGameOver = false;
        return 'The game has been restarted!';
    }

    play(city) {
        if (this.isGameOver){
            return this.getWinnerMessage();
        }

        const normalizedCity = city.toLowerCase();
        if (this.usedCities.some(c => c.toLowerCase() === normalizedCity)){
            this.isGameOver = true;
            this.winner = this.players[1 - this.currentPlayerIndex];
            return this.getWinnerMessage();
        }
        if (this.usedCities.length > 0){
            const lastCity = this.usedCities[this.usedCities.length - 1];
            const lastLetter = lastCity[lastCity.length - 1].toLowerCase();
            const firstLetter = city[0].toLowerCase();

            if (firstLetter !== lastLetter) {
                this.isGameOver = true;
                this.winner = this.players[1- this.currentPlayerIndex];
                return this.getWinnerMessage();
            }
        }
        this.usedCities.push(city);
        this.currentPlayerIndex = 1 - this.currentPlayerIndex;

        return [...this.usedCities];
    }

    getWinnerMessage(){
        return `Game over! The winner is ${this.winner}`;
    }
}

export default CityGame;
