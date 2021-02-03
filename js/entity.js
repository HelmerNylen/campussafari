const MovementType = {
	"Static": 0,
	"Patrol": 1,
	"Wander": 2,
	"Player": 3
};

const Direction = {
	"East": 0,
	"South": 1,
	"West": 2,
	"North": 3
};

class Movement {
	constructor(type, data = null) {
		this.type = type;

		switch (this.type) {
			case MovementType.Static:
				break;
			case MovementType.Patrol:
				this.path = data;
				break;
			case MovementType.Wander:
				this.originX = data.originX;
				this.originY = data.originY;
				this.area = data.area;
				break;
			case MovementType.Player:
				break;
		}
	}
}

class AnimationSet {
	constructor(tilesets, json) {
		this.frameHeight = json.frameHeight;
		for (const dir of Object.keys(Direction)) {
			this[dir.toLowerCase()] = Level.makePatch(tilesets, json[dir.toLowerCase()]);
			this[Direction[dir]] = this[dir.toLowerCase()];
		}
	}

	getFrame(direction, index) {
		const source = this[direction];
		const canvas = document.createElement('canvas');
		canvas.width = source.width;
		canvas.height = this.frameHeight;
		const ctx = canvas.getContext('2d');
		ctx.drawImage(source, 0, index * this.frameHeight, source.width, this.frameHeight, 0, 0, source.width, this.frameHeight);
		return canvas;
	}
}

class Entity {
	constructor (x, y, direction, animationSet, movement) {
		this.x = x;
		this.y = y;
		this.direction = direction;
		if (this.direction === undefined)
			this.direction = Direction.South;
		this.animationSet = animationSet;
		this.movement = movement;
	}

	get currentSprite() {
		// TODO: faktiskt animera, cachea animering etc
		return this.animationSet.getFrame(this.direction, 0);
	}

	static createEntity(tilesets, json) {
		const animationSet = new AnimationSet(tilesets, json.animationSet);
		return new Entity(json.x, json.y, json["direction"], animationSet, new Movement(json.movement.type, json.movement["data"] || null))
	}
}