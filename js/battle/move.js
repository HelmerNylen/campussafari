/**
 * @typedef {number} MoveTarget
 * @enum {MoveTarget}
 */
const MoveTarget = {
	"None":			0b0000, // No target (i.e. apply effect to the environment).
	"HitsAll": 		0b0001, // If set, all indicated targets are hit. Otherwise the strategy must select one.
	          		        // By itself, HitsAll is not a valid move target. Use Everyone.
	"Opponent":		0b0010, // Single opponent, select one in double battles
	"Foes":			0b0011, // = HitsAll | Opponent, hits both opponent teams
	"Self":			0b0100, // Self only
	"Ally":			0b1000, // Ally only
	"Friendly": 	0b1100, // = Self | Ally, select one in double battles
	"BothFriendly":	0b1101,	// = HitsAll | Friendly, hits both friendly teams
	"Everyone": 	0b1111,	// = HitsAll | Self | Ally | Opponent, hits everyone in the battle
};

class Move {
	/**
	 * @param {string} name 
	 * @param {Type} type 
	 * @param {number} baseDamage 
	 * @param {number} uses 
	 * @param {MoveTarget} target 
	 * @param {number} precedence 
	 */
	constructor(name, type, baseDamage, isSpecial, uses, target, precedence = 0) {
		this.name = name;
		this.type = type;
		this.baseDamage = baseDamage;
		this.isSpecial = isSpecial;
		this.maxUses = uses;
		this.currentUses = uses;
		this.target = target;
		this.precedence = precedence;
	}

	static default() {
		return new Move("Splash", Type.Rock, 0, false, Number.POSITIVE_INFINITY, MoveTarget.Self);
	}

	/**
	 * @param {Team} origin 
	 * @param {Team | Team[]} target 
	 */
	perform(origin, target) {
		this.currentUses--;

		if (this.target & MoveTarget.HitsAll) {
			for (const hit of target) {
				hit.active.takeDamage(hit.active.calculateIncomingDamage(origin.active, this));
			}
		} else if (target === null && this.target === MoveTarget.Ally) {
			// Cannot use moves that only target allies in single battles.
			// Should give proper message indicating nothing happened.
			console.log("Used ally-targeting move in single battle");
		} else {
			target.active.takeDamage(target.active.calculateIncomingDamage(origin.active, this));
		}
	}
}