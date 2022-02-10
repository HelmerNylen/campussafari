const gabbeImg = Resource.addAsset("sprites/gabbe.png");
const helmerImg = Resource.addAsset("sprites/helmer.png");
const jonasImg = Resource.addAsset("sprites/jonas.png");

class StatModifiers {
	constructor(physicalAttack = 0, physicalDefence = 0,
			specialAttack = 0, specialDefence = 0,
			speed = 0, accuracy = 0, evasion = 0) {
		this.physicalAttack = physicalAttack;
		this.physicalDefence = physicalDefence;
		this.specialAttack = specialAttack;
		this.specialDefence = specialDefence;
		this.speed = speed;
		this.accuracy = accuracy;
		this.evasion = evasion;
	}

	static toMultiplier(modifier) {
		const numerator = 2 + Math.max(0, modifier);
		const denominator = 2 + Math.max(0, -modifier);
		return numerator / denominator;
	}
}

class Teknolog {

	/**
	 * 
	 * @param {string} name 
	 * @param {number} type 
	 */
	constructor(name, type) {
		this.name = name;
		this.type = type;
		this.image = Resource.getAsset([gabbeImg, helmerImg, jonasImg][Math.floor(Math.random() * 3)]);
		this.moves = [
			new Move("Standard", this.type, 30, 20),
			new Move("Powerful", this.type, 60, 10),
			new Move("Useless", this.type, 0, 10),
			new Move("Unavailable", this.type, 160, 0)
		];
		this.maxHp = Math.floor(Math.random() * 60 + 70);
		this.physicalAttack = Math.floor(Math.random() * 20 + 10);
		this.physicalDefence = Math.floor(Math.random() * 20 + 10);
		this.specialAttack = Math.floor(Math.random() * 20 + 10);
		this.specialDefence = Math.floor(Math.random() * 20 + 10);
		this.speed = Math.floor(Math.random() * 20 + 10);

		this.currentHp = this.maxHp;
		this.modifiers = new StatModifiers();
	}

	get isKnockedOut() {
		return this.currentHp <= 0;
	}

	get modifiedPhysicalAttack() {
		return StatModifiers.toMultiplier(this.modifiers.physicalAttack) * this.physicalAttack;
	}

	get modifiedPhysicalDefence() {
		return StatModifiers.toMultiplier(this.modifiers.physicalDefence) * this.physicalDefence;
	}

	get modifiedSpecialAttack() {
		return StatModifiers.toMultiplier(this.modifiers.specialAttack) * this.specialAttack;
	}

	get modifiedSpecialDefence() {
		return StatModifiers.toMultiplier(this.modifiers.specialDefence) * this.specialDefence;
	}

	get modifiedSpeed() {
		return StatModifiers.toMultiplier(this.modifiers.speed) * this.speed;
	}

	/**
	 * @param {Teknolog} attacker 
	 * @param {Move} move 
	 */
	calculateIncomingDamage(attacker, move) {
		const attackDefenceMultiplier = move.isSpecial ? attacker.modifiedSpecialAttack / this.modifiedSpecialDefence : attacker.modifiedPhysicalAttack / this.modifiedPhysicalDefence;
		const typeMultiplier = getTypeEffectiveness(move.type, this.type);
		const proficiencyMultiplier = move.type === attacker.type ? 2 : 1;

		return move.baseDamage * attackDefenceMultiplier * typeMultiplier * proficiencyMultiplier;
	}

	/**
	 * @param {number} amount 
	 */
	takeDamage(amount) {
		this.currentHp = Math.max(0, this.currentHp - amount);
	}
}