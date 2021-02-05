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
const ENTITY_PACE = 400;

/** Definierar om/hur en Entity rör sig */
class Movement {
	/**
	 * Skapa en ny Movement
	 * @param {number} type - MovementType.X
	 * @param {*} data - Definierar områdena för Patrol och Wander
	 */
	constructor(type, data = null) {
		this.type = type;

		switch (this.type) {
			case MovementType.Static:
				break;
			case MovementType.Patrol:
				this.path = Movement._uncompressPath(data);
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

	static nextX(gridX, direction) {
		if (direction === Direction.East)
			return gridX + 1;
		else if (direction === Direction.West)
			return gridX - 1;
		else
			return gridX;
	}

	static nextY(gridY, direction) {
		if (direction === Direction.North)
			return gridY - 1;
		else if (direction === Direction.South)
			return gridY + 1;
		else
			return gridY;
	}

	/** Interpolerar x-komponenten av ett steg */
	static interpolateX(gridX, direction, progress) {
		if (direction === Direction.East)
			return gridX - 1 + progress;
		else if (direction === Direction.West)
			return gridX + 1 - progress;
		else
			return gridX;
	}

	/** Interpolerar y-komponenten av ett steg */
	static interpolateY(gridY, direction, progress) {
		if (direction === Direction.North)
			return gridY + 1 - progress;
		else if (direction === Direction.South)
			return gridY - 1 + progress;
		else
			return gridY;
	}

	static PATROL_WAIT = -1;

	static _uncompressPath(path) {
		let res = [];

		for (let pathElement of path) {
			if (typeof pathElement === "string")
				pathElement = [pathElement, 1];

			switch (pathElement[0].toLowerCase()) {
				// Instructions to move a tile in a direction
				case "north":
				case "south":
				case "east":
				case "west":
					for (const dir of Object.keys(Direction)) {
						if (pathElement[0].toLowerCase() === dir.toLowerCase()) {
							for (let i = 0; i < pathElement[1]; i++)
								res.push(Direction[dir]);
							break;
						}
					}
					break;

				// Instruction to wait 1 step worth of time
				case "wait":
					for (let i = 0; i < pathElement[1]; i++)
						res.push(this.PATROL_WAIT);
					break;
				
				// Instruction to follow all the opposites of previous commands (returning to the starting position)
				case "reverse":
					for (let i = res.length - 1; i >= 0; i--)
						if (res[i] === this.PATROL_WAIT)
							res.push(res[i]);
						else 
							res.push((res[i] + 2) % 4); // Opposite direction
					break;

				default:
					throw Error("Cannot parse path element: " + pathElement);
			}
		}

		return res;
	}
}

/** Sköter animeringen när en Entity rör sig */
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

	// TODO: återanvänd befintlig canvas på nåt sätt (cacha alla subimages när ett animationset skapas typ)
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
	/**
	 * Skapar en ny Entity
	 * @param {number} x 
	 * @param {number} y 
	 * @param {number} direction 
	 * @param {AnimationSet} animationSet 
	 * @param {Movement} movement 
	 */
	constructor (x, y, direction, animationSet, movement) {
		this.x = x;
		this.y = y;
		this.gridX = Math.round(x);
		this.gridY = Math.round(y);
		this.direction = direction;
		if (this.direction === undefined)
			this.direction = Direction.South;
		this.animationSet = animationSet;
		this.movement = movement;
		this.movementProgress = null;
		this.waitTimer = null;
		this.subimage = 0;

		if (this.movement.type === MovementType.Patrol)
			this.patrolIndex = 0;

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
		if (this.waitTimer !== null) {
			this.waitTimer -= delta;
			if (this.waitTimer <= 0)
				this.waitTimer = null;
		} else
			this._getMovementInstruction(userinput);
		this._animationStep(delta);
	}

	_getMovementInstruction(userinput) {
		if (this.movement.type === MovementType.Static)
			return;
		// If responding to player input and input is received,
		// set direction and start walking
		else if (this.movement.type === MovementType.Player && userinput !== null) {
			// Only accept input if we are standing still or at the end of a step
			if (this.movementProgress === null || this.movementProgress === 1) {
				switch (userinput) {
					case Direction.North:
					case Direction.South:
					case Direction.East:
					case Direction.West:
						this.direction = userinput;
						this.gridX = Movement.nextX(this.gridX, this.direction);
						this.gridY = Movement.nextY(this.gridY, this.direction);
						this._currentSprite = null;
						this.movementProgress = 0;
						break;
					default:
						break;
				}
			}
		}
		else if (this.movement.type === MovementType.Patrol) {
			if (this.movementProgress === null || this.movementProgress === 1) {
				const dir = this.movement.path[this.patrolIndex];
				
				switch (dir) {
					case Direction.North:
					case Direction.South:
					case Direction.East:
					case Direction.West:
						this.direction = dir;
						this.gridX = Movement.nextX(this.gridX, this.direction);
						this.gridY = Movement.nextY(this.gridY, this.direction);
						this.patrolIndex = (this.patrolIndex + 1) % this.movement.path.length;
						this._currentSprite = null;
						this.movementProgress = 0;
						break;

					case Movement.PATROL_WAIT:
						this.patrolIndex = (this.patrolIndex + 1) % this.movement.path.length;
						this.waitTimer = ENTITY_PACE;
						break;
				}
			}
		}
	}

	_animationStep(delta) {
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