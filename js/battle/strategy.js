class Strategy {
	constructor() {

	}

	/**
	 * 
	 * @param {Team} ownTeam 
	 * @param {Team} opponentTeam 
	 */
	getMoves(ownTeam, opponentTeam) {
		throw new Error("Not implemented");
	}
}

class StrategyRandom extends Strategy {
	/**
	* 
	* @param {Team} ownTeam 
	* @param {Team} opponentTeam 
	*/
	getMoves(ownTeam, opponentTeam) {
		return ownTeam.gang.map(teknolog => {
			const availableMoves = teknolog.moves.filter(move => move.currentUses > 0);
			if (availableMoves.length === 0)
				return Move.default();
			return availableMoves[Math.floor(Math.random() * availableMoves.length)];
		});
	}
}

class StrategyPlayer extends Strategy {
	/**
	* 
	* @param {Team} ownTeam 
	* @param {Team} opponentTeam 
	*/
	getMoves(ownTeam, opponentTeam) {
		const moves = ownTeam.gang.map(teknolog => {
			const availableMoves = teknolog.moves.filter(move => move.currentUses > 0);
			if (availableMoves.length === 0)
				return Move.default();
			return availableMoves[Math.floor(Math.random() * availableMoves.length)];
		});
		alert("Du valde: " + moves);
		return moves;
	}
}