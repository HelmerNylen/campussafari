class Team {
	/**
	 * @param {string} leaderName 
	 * @param {Teknolog[]} members 
	 * @param {*} leaderAppearance 
	 * @param {Strategy} strategy 
	 */
	constructor(leaderName, members, leaderAppearance = null, strategy = Strategy.Random) {
		this.leaderName = leaderName;
		this.members = members;
		this.leaderAppearance = leaderAppearance;
		this.strategy = strategy;

		this.active = members[0];
	}
}

class PseudoTeam {
	/**
	 * @param {Team} original 
	 * @param {Teknolog} active 
	 */
	constructor(original, active = null) {
		this.original = original;
		this.active = active || original.members[1];
	}

	get strategy() { return this.original.strategy; }
	get members() { return this.original.members; }
}
