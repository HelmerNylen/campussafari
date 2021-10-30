class Team {
	constructor(leaderName, gang, leaderAppearance = null, strategy = Strategy.Random) {
		this.leaderName = leaderName;
		this.gang = gang;
		this.leaderAppearance = leaderAppearance;
		this.strategy = strategy;
	}
}