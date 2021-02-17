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

// Millisekunder det tar att gå ett steg
const ENTITY_PACE = 400;
// Millisekunder det tar att vända sig
// (man måste hålla in så här länge för att börja gå en annan riktning)
const TURN_DURATION = 100;
// Campus defence <3
const MAGIC_NUMBER = 4;

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
				this.areaWidth = data.areaWidth;
				this.areaHeight = data.areaHeight;
				this.area = data["area"] || new Array(this.areaWidth * this.areaHeight).fill(0);
				this.waitTimeMultiplier = data["waitTimeMultiplier"] || 1;
				this.extraMoveChance = data["extraMoveChance"] || 0.2;
				this.turnChance = data["turnChance"] || 0.6;
				this.wanderWaitTime = () => ENTITY_PACE * MAGIC_NUMBER * this.waitTimeMultiplier * (1 + Math.random() * 0.5);
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
							if (pathElement[1] === 0)
								res.push(["turn", Direction[dir]]);
							else
								for (let i = 0; i < pathElement[1]; i++)
									res.push(["walk", Direction[dir]]);
							break;
						}
					}
					break;

				// Instruction to wait 1 step worth of time
				case "wait":
					for (let i = 0; i < pathElement[1]; i++)
						res.push(["wait"]);
					break;
				
				// Instruction to follow all the opposites of previous commands (returning to the starting position)
				case "reverse":
					for (let i = res.length - 1; i >= 0; i--) {
						if (res[i][0] === "wait")
							res.push(res[i]);
						else if (res[i][0] === "turn")
							// Vet inte om detta är det väntade beteendet egentligen men men
							res.push([res[i][0], (res[i][1] + 2) % 4]); // Opposite direction
						else // res[i][0] === "walk"
							res.push([res[i][0], (res[i][1] + 2) % 4]); // Opposite direction
					}
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
	constructor (x, y, direction, animationSet, movement, isSolid = true, interaction = null) {
		this.x = x;
		this.y = y;
		this.direction = direction;
		if (this.direction === undefined)
			this.direction = Direction.South;
		this.animationSet = animationSet;
		this.movement = movement;
		this.movementProgress = null;
		this.waitTimer = null;
		this.subimage = 0;

		this.isSolid = isSolid;
		this.gridX = null;
		this.gridY = null;
		if (this.x !== null && this.y !== null) {
			this.moveTo(Math.round(this.x), Math.round(this.y));
		}

		if (this.movement.type === MovementType.Patrol)
			this.patrolIndex = 0;

		this.interaction = interaction;

		this._currentSprite = null;
	}

	get currentSprite() {
		if (this._currentSprite === null && this.animationSet !== null)
			this._currentSprite = this.animationSet.getFrame(this.direction, this.subimage);
			
		return this._currentSprite;
	}

	get isInvisible() {
		return this.currentSprite === null;
	}

	get isPlayerControlled() {
		return this.movement.type === MovementType.Player;
	}

	static createEntity(tilesets, json) {
		let animationSet = null;
		if (json["animationSet"])
			animationSet = new AnimationSet(tilesets, json["animationSet"]);

		return new Entity(
			json.x, json.y,
			json["direction"],
			animationSet,
			new Movement(MovementType[json.movement.type], json.movement["data"] || null),
			json["solid"],
			// Default interaction is to play dialogue, if there is any
			json["dialogue"] && (() => ExplorationController.instance.playDialogue(json["dialogue"]))
		);
	}

	canMove(direction) {
		return this.canMoveTo(
			Movement.nextX(this.gridX, direction),
			Movement.nextY(this.gridY, direction)
		);
	}

	canMoveTo(gridX, gridY) {
		if (this.movement.type === MovementType.Wander) {
			const relX = gridX - this.movement.originX;
			const relY = gridY - this.movement.originY;
			// Wandering entities cannot move outside their region,
			if (relX < 0 || relX >= this.movement.areaWidth || relY < 0 || relY >= this.movement.areaHeight)
				return false;
			// or to forbidden spaces inside the region
			if (this.movement.area[relX + relY * this.movement.areaWidth])
				return false;
		}

		const area = ExplorationController.instance.areaAtOrNull(gridX, gridY);
		return area !== null && !(area & Area.Occupied);
	}

	move(direction) {
		this.moveTo(
			Movement.nextX(this.gridX, direction),
			Movement.nextY(this.gridY, direction)
		);
	}

	moveTo(newGridX, newGridY) {
		if (this.isSolid && this.gridX !== null && this.gridY !== null) {
			// Vacate the spot the entity is leaving
			ExplorationController.instance.setAreaAt(
				this.gridX, this.gridY,
				Area.Occupied, false
			);
		}

		this.gridX = newGridX;
		this.gridY = newGridY;

		if (this.isSolid && this.gridX !== null && this.gridY !== null) {
			// Occupy the spot the entity is arriving in
			ExplorationController.instance.setAreaAt(
				this.gridX, this.gridY,
				Area.Occupied, true
			);
		}
	}

	/** Run when an entity is being interacted with (e.g. spoken with by the player) */
	interactWith(incomingFrom) {
		if (this.movement.type !== MovementType.Static) {
			this.direction = incomingFrom;
			this._currentSprite = null;
		}
		
		if (this.interaction)
			this.interaction();
	}

	/** Interacts with the entity this entity is facing */
	startInteraction() {
		const lookAtX = Movement.nextX(this.gridX, this.direction);
		const lookAtY = Movement.nextY(this.gridY, this.direction);
		ExplorationController.instance.entities.forEach(e => {
			if (e.gridX === lookAtX && e.gridY === lookAtY)
				e.interactWith((this.direction + 2) % 4); // Opposite direction
		});
	}

	update(delta, userinput, inputDuration) {
		if (this.waitTimer !== null) {
			this.waitTimer -= delta;
			if (this.waitTimer <= 0)
				this.waitTimer = null;
		} else
			this._getMovementInstruction(userinput, inputDuration);
		this._animationStep(delta);
	}

	_getMovementInstruction(userinput, inputDuration) {
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
						// If we are already facing the correct direction,
						// start moving in the indicated direction
						if (this.direction === userinput) {
							if (this.canMove(this.direction)) {
								this.move(this.direction);
								this.movementProgress = 0;
							}
						}
						else {
							this.direction = userinput;
							this._currentSprite = null;
							// Turn immediately if currently walking
							if (this.movementProgress !== 1)
								this.waitTimer = TURN_DURATION;
						}
						break;
					case ExplorationController.PLAYER_INTERACT:
						this.startInteraction();
						break;
					default:
						break;
				}
			}
		}
		else if (this.movement.type === MovementType.Patrol) {
			if (this.movementProgress === null || this.movementProgress === 1) {
				const instruction = this.movement.path[this.patrolIndex];
				
				switch (instruction[0]) {
					case "walk":
						this.direction = instruction[1];
						this._currentSprite = null;
						if (this.canMove(this.direction)) {
							this.move(this.direction);
							this.patrolIndex = (this.patrolIndex + 1) % this.movement.path.length;
							this.movementProgress = 0;
						} else
							this.waitTimer = ENTITY_PACE;
						break;

					case "turn":
						this.direction = instruction[1];
						this._currentSprite = null;
						this.patrolIndex = (this.patrolIndex + 1) % this.movement.path.length;
						this.waitTimer = TURN_DURATION * 2;
						break;

					case "wait":
						this.patrolIndex = (this.patrolIndex + 1) % this.movement.path.length;
						this.waitTimer = ENTITY_PACE;
						break;
				}
			}
		}
		else if (this.movement.type === MovementType.Wander) {
			if (this.movementProgress === null
					|| (this.movementProgress === 1 && Math.random() < this.movement.extraMoveChance)) {
				
				if (Math.random() < this.movement.turnChance) {
					// Wandering can either just turn the entity
					const dirs = Object.values(Direction).filter(d => d !== this.direction);
					this.direction = dirs[Math.floor(Math.random() * dirs.length)];
					this._currentSprite = null;
					this.waitTimer = this.movement.wanderWaitTime();
				} else {
					// Or have it walk a step in a valid direction
					const dirs = Object.values(Direction).filter(d => this.canMove(d));
					if (dirs.length > 0) {
						this.direction = dirs[Math.floor(Math.random() * dirs.length)];
						this._currentSprite = null;
						this.move(this.direction);
						this.movementProgress = 0;
					} else // No directions available, wait
						this.waitTimer = this.movement.wanderWaitTime();
				}
			} else if (this.movementProgress === 1)
				this.waitTimer = this.movement.wanderWaitTime();
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
			const newSubimage = Math.min(
				this.animationSet.length[this.direction] - 1,
				Math.floor(this.movementProgress * this.animationSet.length[this.direction])
			);
			if (newSubimage !== this.subimage) {
				this.subimage = newSubimage;
				this._currentSprite = null;
			}

			// Update position
			this.x = Movement.interpolateX(this.gridX, this.direction, this.movementProgress);
			this.y = Movement.interpolateY(this.gridY, this.direction, this.movementProgress);
		}
	}

	getState() {
		let state = {
			direction: this.direction,
			gridX: this.gridX,
			gridY: this.gridY,
			movementProgress: this.movementProgress,
			waitTimer: this.waitTimer
		};
		if (this.movement.type === MovementType.Patrol)
			state.patrolIndex = this.patrolIndex;

		return state;
	}

	setState(state) {
		this.moveTo(state.gridX, state.gridY);
		this.direction = state.direction;
		this.movementProgress = state.movementProgress;
		this.waitTimer = state.waitTimer;
		if (this.movement.type === MovementType.Patrol)
			this.patrolIndex = state.patrolIndex;

		if (this.movementProgress === null) {
			this.subimage = 0;
			this.x = this.gridX;
			this.y = this.gridY;
		}
		else {
			this.subimage = Math.min(
				this.animationSet.length[this.direction] - 1,
				Math.floor(this.movementProgress * this.animationSet.length[this.direction])
			);
			this.x = Movement.interpolateX(this.gridX, this.direction, this.movementProgress);
			this.y = Movement.interpolateY(this.gridY, this.direction, this.movementProgress);
		}
		this._currentSprite = null;
	}

	static setStates(entities, states) {
		if (entities.length !== states.length)
			throw new Error(`Different number of entities (${entities.length}) and states (${states.length}) provided`);
		
		// Frigör alla platser som entities står på
		for (const entity of entities)
			entity.moveTo(null, null);
		
		for (let i = 0; i < entities.length; i++)
			entities[i].setState(states[i]);
	}
}