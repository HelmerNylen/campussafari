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
			const prompt = availableMoves.map((move, i) => `${i + 1}: ${move.name}`).join("\n");
			let chosenIndex;
			do {
				chosenIndex = parseInt(window.prompt(`Choose move for ${teknolog.name}: ${prompt}`, 1)) - 1;
			} while (!(chosenIndex >= 0 && chosenIndex < availableMoves.length));
		});
		return moves;
	}
}