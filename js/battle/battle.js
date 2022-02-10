class BattleController {
	/** Den aktiva instansen, om sådan finns
	 *  @type BattleController */
	static instance = null;
	constructor(maincanvas, battlearea) {
		if (BattleController.instance)
			throw new Error("There is already an active battlecontroller");
		this.maincanvas = maincanvas;
		this.battlearea = battlearea;
		this.opponentImgs = battlearea.children.opponents.children;
		this.middleCanvas = battlearea.children.middlelayer;
		this.allyImgs = battlearea.children.allies.children;
		this.topCanvas = battlearea.children.toplayer;
		this.textbox = document.getElementById("textbox");
		this.opponentInfoboxes = battlearea.children.infoboxes.children.info_opponents.children;
		this.allyInfoboxes = battlearea.children.infoboxes.children.info_allies.children;
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
				// setTimeout(this.endBattle.bind(this), 3000);
			})
			this.topCanvas.style["opacity"] = 0;
			this.infoboxesVisible(true);
		});
	}

	startTest() {
		const student = new Teknolog("Student", Type.Rock);
		const labbasse = new Teknolog("Labbasse", Type.Scissors);
		const larare = new Teknolog("Lärare", Type.Paper);
		student.currentHp = Math.floor(student.currentHp * (0.1 + Math.random() * 0.9));
		labbasse.currentHp = Math.floor(labbasse.currentHp * (0.1 + Math.random() * 0.9));
		larare.currentHp = Math.floor(larare.currentHp * (0.1 + Math.random() * 0.9));

		const playerTeam = new Team("Player Playersdottír", [
			student,
		], null, new StrategyPlayer());
		if (Math.random() < 0.5) {
			const opponentTeam = new Team("Motståndare Motståndarsson", [
				labbasse,
				larare,
			], null, new StrategyRandom());
			this.startSingle(playerTeam, opponentTeam);
		} else {
			const opponentTeamLeft = new Team("Motståndare Vänstersson", [
				labbasse,
			], null, new StrategyRandom());
			const opponentTeamRight = new Team("Motståndare Högersson", [
				larare,
			], null, new StrategyRandom());
			this.start1v2(playerTeam, opponentTeamLeft, opponentTeamRight);
		}
	}

	startSingle(player, opponent, backdrop) {
		this.battle = new Single(player, opponent);
		this.animateIntro(backdrop);

		BattleController.populateCanvas(this.allyImgs[0], player.active.image);
		BattleController.populateCanvas(this.allyImgs[1], null);
		BattleController.populateCanvas(this.opponentImgs[0], opponent.active.image);
		BattleController.populateCanvas(this.opponentImgs[1], null);
	}

	start1v2(player, opponentLeft, opponentRight, backdrop) {
		this.battle = new Double(player, opponentLeft, opponentRight);
		this.animateIntro(backdrop);

		BattleController.populateCanvas(this.allyImgs[0], player.active.image);
		BattleController.populateCanvas(this.allyImgs[1], null);
		BattleController.populateCanvas(this.opponentImgs[0], opponentLeft.active.image);
		BattleController.populateCanvas(this.opponentImgs[1], opponentRight.active.image);
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
		this.infoboxesVisible(false);
	}

	infoboxesVisible(visible = true) {
		if (visible) {
			for (let i = 0; i < this.opponentInfoboxes.length; i++) {
				if (this.battle.foeTeams.length > i)
					this.opponentInfoboxes[i].classList.remove("hidden");
				else
					this.opponentInfoboxes[i].classList.add("hidden");
			}
			for (let i = 0; i < this.allyInfoboxes.length; i++) {
				if (this.battle.friendTeams.length > i)
					this.allyInfoboxes[i].classList.remove("hidden");
				else
					this.allyInfoboxes[i].classList.add("hidden");
			}
			this.updateInfoboxes();
		} else {
			for (const box of this.opponentInfoboxes)
				box.classList.add("hidden");
			for (const box of this.allyInfoboxes)
				box.classList.add("hidden");
		}
	}

	updateInfoboxes(transition = false) {
		if (transition)
			console.warn("Animated changes to info boxes not implemented");
		
		for (let i = 0; i < this.battle.foeTeams.length; i++) {
			const box = this.opponentInfoboxes[i];
			const teknolog = this.battle.foeTeams[i].active;
			if (!teknolog) {
				box.classList.add("hidden");
				continue;
			}
			box.getElementsByClassName("info_name")[0].innerText = teknolog.name;
			const hpRatio = teknolog.currentHp / teknolog.maxHp;
			box.getElementsByClassName("healthbar_bar")[0].style = (
				`width: ${hpRatio * 100}%; `
				+ `background-color: ${BattleController.colorFromHp(hpRatio)};`);
		}
		
		for (let i = 0; i < this.battle.friendTeams.length; i++) {
			const box = this.allyInfoboxes[i];
			const teknolog = this.battle.friendTeams[i].active;
			if (!teknolog) {
				box.classList.add("hidden");
				continue;
			}
			box.getElementsByClassName("info_name")[0].innerText = teknolog.name;
			const hpRatio = teknolog.currentHp / teknolog.maxHp;
			box.getElementsByClassName("healthbar_bar")[0].style = (
				`width: ${hpRatio * 100}%; `
				+ `background-color: ${BattleController.colorFromHp(hpRatio)};`);
			box.getElementsByClassName("current")[0].innerText = teknolog.currentHp;
			box.getElementsByClassName("total")[0].innerText = teknolog.maxHp;
		}
	}

	static colorFromHp(hp) {
		const green = 2 * Math.min(hp, 0.5);
		const red = 2 * Math.min(1 - hp, 0.5);
		return `rgb(${red * 255}, ${green * 255}, 20)`
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
	/**
	 * @param {Team[]} friendTeams 
	 * @param {Team[]} foeTeams 
	 */
	constructor(friendTeams, foeTeams, onEnd = null) {
		this.friendTeams = friendTeams;
		this.foeTeams = foeTeams;
		this.allTeams = friendTeams.concat(this.foeTeams);

		this.onEnd = onEnd;
	}

	get playerTeam() {
		return this.friendTeams[0];
	}

	/**
	 * @returns {Move[]} 
	 */
	getFriendMoves() {
		throw new Error("Not implemented");
	}

	/**
	 * @returns {Move[]} 
	 */
	getFoeMoves() {
		throw new Error("Not implemented");
	}

	/**
	 * @param {Move} moveA 
	 * @param {Move} moveB 
	 * @param {Team} teamA 
	 * @param {Team} teamB 
	 */
	compareMoveSpeed(moveA, moveB, teamA, teamB) {
		if (moveA.precedence !== moveB.precedence)
			return moveA.precedence - moveB.precedence;
		return teamA.active.modifiedSpeed - teamB.active.modifiedSpeed;
	}

	isFriendTeam(team) {
		return this.friendTeams.findIndex(t => t === team) !== -1;
	}

	isFoeTeam(team) {
		return this.foeTeams.findIndex(t => t === team) !== -1;
	}

	isOpponentOf(referenceTeam, team) {
		return this.isFriendTeam(referenceTeam) ^ this.isFriendTeam(team);
	}

	getAlliesOf(team) {
		return this.isFriendTeam(team) ? this.friendTeams : this.foeTeams;
	}

	getOpponentsOf(team) {
		return this.isFriendTeam(team) ? this.foeTeams : this.friendTeams;
	}

	/**
	 * @param {Move} move 
	 * @param {Team} originatingTeam 
	 */
	performMove(move, originatingTeam) {
		console.log(`${originatingTeam.active.name} performed ${move.name}!`);
		let target = null;
		const friendlies = this.getAlliesOf(originatingTeam);
		const opponents = this.getOpponentsOf(originatingTeam);

		let possibletargets = [];
		if (move.target & MoveTarget.Self)
			possibletargets.push(originatingTeam);
		if (move.target & MoveTarget.Ally && friendlies.length !== 1)
			possibletargets.push(friendlies.find(t => t !== originatingTeam));
		if (move.target & MoveTarget.Opponent)
			possibletargets = possibletargets.concat(opponents);
		
		possibletargets = possibletargets.filter(team => team.active !== null);

		if (move.target & MoveTarget.HitsAll) {
			target = possibletargets;
			if (target.length === 0)
				throw new Error(`HitsAll bit set but no targets specified on move '${move.name}'`);
		} else if (possibletargets.length !== 0) {
			target = possibletargets[Math.floor(Math.random() * possibletargets.length)];
		}

		move.perform(originatingTeam, target);
	}

	/**
	 * @param {Team} team 
	 */
	knockedOutActive(team) {
		console.log(`${originatingTeam.active.name} was knocked out!`);

		const inBattle = this.getAlliesOf(team).map(
			allied => allied.active
		);
		const canSendOut = team.members.filter(
			teknolog => !teknolog.isKnockedOut && (inBattle.findIndex(t => t === teknolog) === -1)
		);
		if (canSendOut.length !== 0)
			team.active = canSendOut[0];
		else {
			team.active = null;
			if (this.getAlliesOf(team).every(team => team.active === null)) {
				const friendliesWon = this.isFoeTeam(team);
				console.log(`Battle ended. ${friendliesWon ? 'Player side' : 'Opponents'} won!`);
				if (this.onEnd)
					this.onEnd(friendliesWon);
			}
		}
	}

	turn() {
		const friendMoves = new Map(this.getFriendMoves().map((move, index) => [this.friendTeams[index], move]));
		const foeMoves = new Map(this.getFoeMoves().map((move, index) => [this.foeTeams[index], move]));
		const allMoves = new Map([...friendMoves, ...foeMoves]);

		const moveOrder = [...allMoves].sort(([teamA, moveA], [teamB, moveB]) => this.compareMoveSpeed(moveA, moveB, teamA, teamB));

		for (const [teamPerformingMove, move] of moveOrder) {
			this.performMove(move, teamPerformingMove);

			// Check for knocked out participants, first on the opponents' side
			const opponentsFirst = this.allTeams.sort(
				(teamA, teamB) => this.isOpponentOf(teamPerformingMove, teamB) - this.isOpponentOf(teamPerformingMove, teamA)
			);
			for (const teamToCheck of opponentsFirst) {
				console.log(`Checking team of ${teamToCheck.leaderName}`);
				if (teamToCheck.active !== null && teamToCheck.active.isKnockedOut)
					this.knockedOutActive(teamToCheck);
			}
		}
	}
}

class Single extends Battle {
	/**
	 * @param {Team} player 
	 * @param {Team} opponent 
	 */
	constructor(player, opponent) {
		super([player], [opponent]);
		console.log("Init single battle");
	}

	get opponentTeam() {
		return this.foeTeams[0];
	}

	getFriendMoves() {
		return [this.playerTeam.strategy.getMoveSingle(this.playerTeam, this.opponentTeam)];
	}

	getFoeMoves() {
		return [this.opponentTeam.strategy.getMoveSingle(this.opponentTeam, this.playerTeam)];
	}
}

class Double extends Battle {
	/**
	 * @param {Team} player 
	 * @param {Team} opponentLeft 
	 * @param {Team} opponentRight 
	 * @param {Team} ally 
	 */
	constructor(player, opponentLeft, opponentRight = null, ally = null) {
		super(
			[player, ally || new PseudoTeam(player)],
			[opponentLeft, opponentRight || new PseudoTeam(opponentLeft)],
		);
		console.log("Init double battle");
	}

	get allyTeam() {
		return this.friendTeams[1];
	}

	getFriendMoves() {
		return [
			this.playerTeam.strategy.getMoveDouble(this.playerTeam, this.foeTeams, this.allyTeam),
			this.allyTeam.strategy.getMoveDouble(this.allyTeam, this.foeTeams, this.playerTeam),
		];
	}

	getFoeMoves() {
		return [
			this.foeTeams[0].strategy.getMoveDouble(this.foeTeams[0], this.friendTeams, this.foeTeams[1]),
			this.foeTeams[1].strategy.getMoveDouble(this.foeTeams[1], this.friendTeams, this.foeTeams[0]),
		];
	}
}