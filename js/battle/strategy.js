class Strategy {
	constructor() {

	}

	/**
	 * @param {Team} ownTeam 
	 * @param {Team} opponentTeam 
	 */
	getMoveSingle(ownTeam, opponentTeam) {
		throw new Error("Not implemented");
	}

	// TODO: kommunicera vem man väljer att sikta på i en double battle
	getMoveDouble(ownTeam, opponentTeams, allyTeam) {
		throw new Error("Not implemented");
	}
}

class StrategyRandom extends Strategy {
	/**
	* @param {Team} ownTeam 
	* @param {Team} opponentTeam 
	*/
	getMoveSingle(ownTeam, opponentTeam = null) {
		console.log(ownTeam.active.moves);
		const availableMoves = ownTeam.active.moves.filter(move => move.currentUses > 0);
		if (availableMoves.length === 0)
			return Move.default();
		return availableMoves[Math.floor(Math.random() * availableMoves.length)];
	}

	getMoveDouble(ownTeam, opponentTeams = null, allyTeam = null) {
		this.getMoveSingle(ownTeam, null);
	}
}

class StrategyPlayer extends Strategy {
	/**
	* @param {Team} ownTeam 
	* @param {Team} opponentTeam 
	*/
	getMoveSingle(ownTeam, opponentTeam) {
		console.log(ownTeam);
		console.log(ownTeam.active);
		console.log(ownTeam.active.moves);
		const availableMoves = ownTeam.active.moves.filter(move => move.currentUses > 0);
		if (availableMoves.length === 0)
			return Move.default();
		const prompt = availableMoves.map((move, i) => `${i + 1}: ${move.name}`).join("\n");
		let chosenIndex;
		do {
			try {
				chosenIndex = parseInt(window.prompt(`Choose move for ${ownTeam.active.name}: ${prompt}`, 1)) - 1;
			} catch (e) {
				chosenIndex = -1;
			}
		} while (!(chosenIndex >= 0 && chosenIndex < availableMoves.length));
		return availableMoves[chosenIndex];
	}

	getMoveDouble(ownTeam, opponentTeams, allyTeam) {
		return this.getMoveSingle(ownTeam, null);
	}
}