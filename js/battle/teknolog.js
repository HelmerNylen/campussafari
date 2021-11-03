const gabbeImg = Resource.addAsset("sprites/gabbe.png");
const helmerImg = Resource.addAsset("sprites/helmer.png");
const jonasImg = Resource.addAsset("sprites/jonas.png");

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
		this.hp = Math.floor(Math.random() * 60 + 70);
		this.physicalAttack = Math.floor(Math.random() * 20 + 10);
		this.physicalDefence = Math.floor(Math.random() * 20 + 10);
		this.specialAttack = Math.floor(Math.random() * 20 + 10);
		this.specialDefence = Math.floor(Math.random() * 20 + 10);
		this.speed = Math.floor(Math.random() * 20 + 10);
	}
}