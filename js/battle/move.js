class Move {
	constructor(name, type, baseDamage, uses) {
		this.name = name;
		this.type = type;
		this.baseDamage = baseDamage;
		this.maxUses = uses;
		this.currentUses = uses;
	}

	static default() {
		return new Move("Splash", Type.Rock, 0, Number.POSITIVE_INFINITY);
	}
}