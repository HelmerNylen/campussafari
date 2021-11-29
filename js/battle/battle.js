class BattleController {
	/** Den aktiva instansen, om sådan finns
	 *  @type BattleController */
	static instance = null;
	constructor(maincanvas, battlearea) {
		this.maincanvas = maincanvas;
		this.battlearea = battlearea;
		this.opponentImgs = battlearea.children.opponents.children;
		this.middleCanvas = battlearea.children.middlelayer;
		this.allyImgs = battlearea.children.allies.children;
		this.topCanvas = battlearea.children.toplayer;
		this.textbox = document.getElementById("textbox");
		/**
		 * The currently active battle
		 * @type {Battle}
		 */
		this.battle = null;

		// ...

		BattleController.instance = this;
	}

	animate(element, properties, time, timingFunction = "linear", delay = 0) {
		return new Promise(resolve => {
			if (!(properties instanceof Array))
				properties = [properties];
			element.style["transition-property"] = properties.join(", ");
			element.style["transition-duration"] = `${time}ms`;
			element.style["transition-timing-function"] = timingFunction;
			element.style["transition-delay"] = timingFunction;
			element.addEventListener("transitionend", (e) => {
				delete element.style["transition-property"];
				delete element.style["transition-duration"];
				delete element.style["transition-timing-function"];
				delete element.style["transition-delay"];
				resolve(e);
			}, {once: true});
		});
	}

	delay(time) {
		return new Promise(resolve => setTimeout(resolve, time));
	} 

	animateIntro(backdrop) {
		this.battlearea.classList.remove("hidden");

		const ctxTop = this.topCanvas.getContext("2d");
		ctxTop.drawImage(this.maincanvas, 0, 0);
		this.topCanvas.style["opacity"] = 1;
		
		this.delay(200).then(() => {
			const ctx = this.maincanvas.getContext("2d");
			ctx.fillStyle = backdrop || "salmon";
			ctx.fillRect(0, 0, this.maincanvas.width, this.maincanvas.height);
			ctx.strokeText("Battle!", this.maincanvas.width / 2, this.maincanvas.height / 2);
			
			this.animate(this.topCanvas, "opacity", 500).then(() => {
				setTimeout(this.endBattle.bind(this), 3000);
			})
			this.topCanvas.style["opacity"] = 0;
		});
	}

	startTest() {
		const playerTeam = new Team("Player Playersdottír", [
			new Teknolog("Student", Type.Rock)
		], null, new StrategyPlayer());
		if (Math.random() < 0.5) {
			const opponentTeam = new Team("Motståndare Motståndarsson", [
				new Teknolog("Labbasse", Type.Scissors),
				new Teknolog("Lärare", Type.Paper)
			], null, new StrategyRandom());
			this.startSingle(playerTeam, opponentTeam);
		} else {
			const opponentTeamLeft = new Team("Motståndare Vänstersson", [
				new Teknolog("Labbasse", Type.Scissors)
			], null, new StrategyRandom());
			const opponentTeamRight = new Team("Motståndare Högersson", [
				new Teknolog("Lärare", Type.Paper)
			], null, new StrategyRandom());
			this.start1v2(playerTeam, opponentTeamLeft, opponentTeamRight);
		}
	}

	startSingle(player, opponent, backdrop) {
		this.battle = new Single(player, opponent);
		this.animateIntro(backdrop);

		BattleController.populateCanvas(this.allyImgs[0], player.gang[0].image);
		BattleController.populateCanvas(this.allyImgs[1], null);
		BattleController.populateCanvas(this.opponentImgs[0], opponent.gang[0].image);
		BattleController.populateCanvas(this.opponentImgs[1], null);
	}

	start1v2(player, opponentLeft, opponentRight, backdrop) {
		this.battle = new Double(player, opponentLeft, opponentRight);
		this.animateIntro(backdrop);

		BattleController.populateCanvas(this.allyImgs[0], player.gang[0].image);
		BattleController.populateCanvas(this.allyImgs[1], null);
		BattleController.populateCanvas(this.opponentImgs[0], opponentLeft.gang[0].image);
		BattleController.populateCanvas(this.opponentImgs[1], opponentRight.gang[0].image);
	}
	
	startDouble(player, ally, opponentLeft, opponentRight, backdrop) {
		throw new Error("Not implemented");
	}

	endBattle() {
		this.battle = null;
		this.delay(200).then(() => {
			this.topCanvas.style["opacity"] = 0;
			const ctxTop = this.topCanvas.getContext("2d");
			ctxTop.fillStyle = "black";
			ctxTop.fillRect(0, 0, this.topCanvas.width, this.topCanvas.height);
			this.animate(this.topCanvas, "opacity", ExplorationController.TRANSITION_LENGTH).then(() => {
				this.delay(50).then(() => {
					this.battlearea.classList.add("hidden");
				});
				ExplorationController.instance.resume();
				ExplorationController.instance.onTransitionDone = () => {
					if (ExplorationController.instance.inDialogue)
						ExplorationController.instance.continueDialogue();
				};
				ExplorationController.instance.transitionTimer = ExplorationController.TRANSITION_LENGTH;
				ExplorationController.instance.transitionType = Transition.FadeIn;
			});
			this.topCanvas.style["opacity"] = 1;
		});
	}

	static populateCanvas(canvasElement, imageOrCanvas) {
		if (imageOrCanvas === null) {
			canvasElement.width = 1;
			canvasElement.height = 1;
			canvasElement.classList.add("hidden");
			return;
		}
		const width = imageOrCanvas.width;
		const height = imageOrCanvas.height;
		canvasElement.width = width;
		canvasElement.height = height;
		canvasElement.classList.remove("hidden");
		let ctx = canvasElement.getContext("2d");
		ctx.clearRect(0, 0, width, height);
		ctx.drawImage(imageOrCanvas, 0, 0);
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
		console.log("Init single battle");
	}
}

class Double extends Battle {
	constructor(player, opponentLeft, opponentRight, ally = null) {
		super([player, ally], [opponentLeft, opponentRight]);
		console.log("Init double battle");
	}
}