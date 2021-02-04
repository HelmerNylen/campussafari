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

// Milliseconds to move one tile
const ENTITY_PACE = 500;

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

	static interpolateX(gridX, direction, progress) {
		if (direction === Direction.East)
			return gridX - 1 + progress;
		else if (direction === Direction.West)
			return gridX + 1 - progress;
		else
			return gridX;
	}

	static interpolateY(gridY, direction, progress) {
		if (direction === Direction.North)
			return gridY + 1 - progress;
		else if (direction === Direction.South)
			return gridY - 1 + progress;
		else
			return gridY;
	}
}

class AnimationSet {
	constructor(tilesets, json) {
		this.frameHeight = json.frameHeight;
		this.length = {};
		for (const dir of Object.keys(Direction)) {
			if (json[dir.toLowerCase()]) {
				this[Direction[dir]] = Level.makePatch(tilesets, json[dir.toLowerCase()]);
				this.length[Direction[dir]] = Math.ceil(this[Direction[dir]].height / this.frameHeight);
			}
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
		this.gridX = x;
		this.gridY = y;
		this.direction = direction;
		if (this.direction === undefined)
			this.direction = Direction.South;
		this.animationSet = animationSet;
		this.movement = movement;
		this.movementProgress = null;
		this.subimage = 0;

		this._currentSprite = null;
	}

	get currentSprite() {
		if (this._currentSprite === null)
			this._currentSprite = this.animationSet.getFrame(this.direction, this.subimage);
			
		return this._currentSprite;
	}

	static createEntity(tilesets, json) {
		const animationSet = new AnimationSet(tilesets, json.animationSet);
		return new Entity(
			json.x, json.y,
			json["direction"],
			animationSet,
			new Movement(MovementType[json.movement.type], json.movement["data"] || null)
		);
	}

	update(delta, userinput) {
		// If responding to player input and input is received,
		// set direction and start walking
		if (this.movement.type === MovementType.Player && userinput !== null) {
			if (this.movementProgress === null) {
				let inputAccepted = true;
				switch (userinput) {
					case Direction.North:
						this.gridY--;
						break;
					case Direction.South:
						this.gridY++;
						break;
					case Direction.East:
						this.gridX++;
						break;
					case Direction.West:
						this.gridX--;
						break;
					default:
						inputAccepted = false;
						break;
				}
				if (inputAccepted) {
					this.direction = userinput;
					this._currentSprite = null;
					this.movementProgress = 0;
				}
			}
		}

		// Stop moving if destination reached
		if (this.movementProgress === 1) {
			this.movementProgress = null;
			this.subimage = 0;
			this._currentSprite = null;
		} else if (this.movementProgress !== null) {
			// Update distance moved
			this.movementProgress = Math.min(1, this.movementProgress + delta / ENTITY_PACE);

			// Compute new animation frame
			const newSubimage = Math.min(this.animationSet.length[this.direction] - 1, Math.floor(this.movementProgress * this.animationSet.length[this.direction]));
			if (newSubimage !== this.subimage) {
				this.subimage = newSubimage;
				this._currentSprite = null;
			}

			// Update position
			this.x = Movement.interpolateX(this.gridX, this.direction, this.movementProgress);
			this.y = Movement.interpolateY(this.gridY, this.direction, this.movementProgress);
		}
	}
}