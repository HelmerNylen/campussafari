class BattleController {
	/** Den aktiva instansen, om sådan finns
	 *  @type BattleController */
	static instance = null;
	constructor(canvas) {
		this.canvas = canvas;
		/**
		 * The currently active battle
		 * @type {Battle}
		 */
		this.battle = null;

		// ...

		BattleController.instance = this;
	}

	animateIntro(backdrop) {
		alert("Fancy animation");
		/**
		 *@type {CanvasRenderingContext2D}
		 */
		const ctx = this.canvas.getContext("2d");
		ctx.fillStyle = backdrop || "salmon";
		ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		ctx.strokeText("Battle!", this.canvas.width / 2, this.canvas.height / 2)

		setTimeout(this.endBattle.bind(this), 5000);
	}

	startTest() {
		const playerTeam = new Team("Player Playersdottír", [
			new Teknolog("Student", Type.Rock)
		], null, new StrategyPlayer());
		const opponentTeam = new Team("Motståndare Motståndarsson", [
			new Teknolog("Labbasse", Type.Scissors),
			new Teknolog("Lärare", Type.Paper)
		], null, new StrategyRandom());
		this.startSingle(playerTeam, opponentTeam);
	}

	startSingle(player, opponent, backdrop) {
		this.battle = new Single(player, opponent);
		this.animateIntro(backdrop);
	}

	start1v2(player, opponentLeft, opponentRight) {
		throw new Error("Not implemented");
	}
	
	startDouble(player, ally, opponentLeft, opponentRight) {
		throw new Error("Not implemented");
	}

	endBattle() {
		this.battle = null;
		ExplorationController.instance.resume();
		ExplorationController.instance.onTransitionDone = () => {
			ExplorationController.instance.transitionTimer = ExplorationController.TRANSITION_LENGTH;
			ExplorationController.instance.transitionType = Transition.FadeIn;
		};
		ExplorationController.instance.transitionTimer = ExplorationController.TRANSITION_LENGTH;
		ExplorationController.instance.transitionType = Transition.FadeOut;
	}
}

class Battle {
	constructor(friendTeams, foeTeams) {
		this.friendTeams = friendTeams;
		this.foeTeams = foeTeams;
	}
}

class Single extends Battle {
	constructor(player, opponent) {
		super([player, null], [opponent, null]);
	}
}

class Double extends Battle {
	constructor(player, opponentLeft, opponentRight, ally = null) {
		super([player, ally], [opponentLeft, opponentRight]);
	}
}