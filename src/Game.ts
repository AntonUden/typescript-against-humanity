import { throws } from "assert/strict";
import { BlackCard } from "./card/BlackCard";
import { Deck } from "./card/Deck";
import { WhiteCard } from "./card/WhiteCard";
import { GameEndReason } from "./enum/GameEndReason";
import { GameStartResponse } from "./enum/GameStartResponse";
import { GameState } from "./enum/GameState";
import { JoinGameResponse } from "./enum/JoinGameResponse";
import { MessageType } from "./enum/MessageType";
import { GameSettings } from "./interfaces/GameSettings";
import { Player } from "./Player";
import { Server } from "./Server";
import { User } from "./User";
import { Utils } from "./Utils";

export class Game {
	private uuid: string;
	private name: string;
	private players: Player[];
	private gameState: GameState;
	private settings: GameSettings;
	private decks: Deck[];

	private activeBlackCard: BlackCard | null;

	private blackCardDeck: BlackCard[];
	private whiteCardDeck: WhiteCard[];

	private _server: Server;


	constructor(server: Server, uuid: string, name: string) {
		this._server = server;
		this.uuid = uuid;
		this.name = name;
		this.gameState = GameState.WAITING;
		this.settings = {
			handSize: 10,
			winScore: 10
		}

		this.activeBlackCard = null;

		this.whiteCardDeck = [];
		this.blackCardDeck = [];
		this.decks = [];
		this.players = [];

		let defaultDeck: Deck | null = this._server.getDeck("Base");
		if (defaultDeck != null) {
			this.decks.push(defaultDeck);
		}
	}

	getUUID(): string {
		return this.uuid;
	}

	getName(): string {
		return this.name;
	}

	getGameSettings(): GameSettings {
		return this.settings;
	}

	isInGame(user: User): boolean {
		for (let i: number = 0; i < this.players.length; i++) {
			if (this.players[i].getUUID() == user.getUUID()) {
				return true;
			}
		}

		return false;
	}

	joinGame(user: User, password: string | null = null): JoinGameResponse {
		if (this.players.length >= this._server.settings.maxPlayersPerGame) {
			return JoinGameResponse.GAME_FULL;
		}

		for (let i = 0; i < this.players.length; i++) {
			this.players[i].getUser().sendMessage(user.getUsername() + " joined the game", MessageType.INFO);
		}

		let player: Player = new Player(this, user);

		this.players.push(player);

		if (this.gameState == GameState.INGAME) {
			this.fillPlayerHand(player);
		}

		this.sendFullUpdate();

		return JoinGameResponse.SUCCESS;
	}

	leaveGame(user: User) {
		for (let i: number = 0; i < this.players.length; i++) {
			if (this.players[i].getUUID() == user.getUUID()) {
				this.players.splice(i, 1);
				break;
			}
		}

		if (this.players.length == 0) {
			this._server.removeGame(this);
			this.sendStateUpdate(user); // user also needs to receive the state update
		} else {
			this.sendFullUpdate(user); // user also needs to receive the state update
			for (let i = 0; i < this.players.length; i++) {
				this.players[i].getUser().sendMessage(user.getUsername() + " left the game", MessageType.INFO);
			}

			if (this.players.length < 3 && this.gameState == GameState.INGAME) {
				this.endGame(GameEndReason.NOT_ENOUGH_PLAYERS);
			}
		}
	}

	isHost(user: User): boolean {
		return this.getHostUUID() == user.getUUID();
	}

	getHostUUID(): string | null {
		if (this.players.length > 0) {
			return this.players[0].getUUID();
		}

		return null;
	}

	getGameState(): GameState {
		return this.gameState;
	}

	destroyInstance() {
		this.players = [];
		this.name = "[deleted]";
	}

	getPlayers(): Player[] {
		return this.players;
	}

	hasDeck(deck: Deck): boolean {
		for (let i = 0; i < this.decks.length; i++) {
			if (this.decks[i].getName() == deck.getName()) {
				return true;
			}
		}

		return false;
	}

	removeDeck(deck: Deck) {
		for (let i = 0; i < this.decks.length; i++) {
			if (this.decks[i].getName() == deck.getName()) {
				this.decks.splice(i, 1);
				break;
			}
		}
	}

	addDeck(deck: Deck) {
		this.decks.push(deck);
	}

	getDecks(): Deck[] {
		return this.decks;
	}

	getBlackCards(): BlackCard[] {
		let result: BlackCard[] = [];

		for (let i = 0; i < this.decks.length; i++) {
			let deck: Deck = this.decks[i];

			for (let j = 0; j < deck.getBlackCards().length; j++) {
				result.push(deck.getBlackCards()[i]);
			}
		}

		return result;
	}

	getWhiteCards(): WhiteCard[] {
		let result: WhiteCard[] = [];

		for (let i = 0; i < this.decks.length; i++) {
			let deck: Deck = this.decks[i];

			for (let j = 0; j < deck.getWhiteCards().length; j++) {
				result.push(deck.getWhiteCards()[i]);
			}
		}

		return result;
	}

	broadcastMessage(message: string, type: MessageType) {
		this.players.forEach((player) => {
			player.getUser().sendMessage(message, type);
		});
	}

	startRound() {
		this.players.forEach((player) => {
			this.fillPlayerHand(player);
		});
		this.activeBlackCard = this.getBlackCard();

		this.sendStateUpdate();
		this.sendGameListUpdateUpdate();
	}

	fillPlayerHand(player: Player) {
		let tries = 0;
		let maxTries = 10000;

		while (player.getHand().length < this.settings.handSize) {
			tries++;
			let card: WhiteCard = this.getWhiteCard();
			if (!player.getHand().includes(card.getText())) {
				player.getHand().push(card.getText());
			}



			// Prevent soft lock
			if (tries > maxTries) {
				console.error("Failed to fill the hand of " + player.getUser().getUsername() + " within " + maxTries + " tries in game " + this.getName());
				return;
			}
		}
	}

	getWhiteCard(): WhiteCard {
		if (this.whiteCardDeck.length == 0) {
			this.decks.forEach((deck) => {
				deck.getWhiteCards().forEach((card) => {
					this.whiteCardDeck.push(card);
				});
			});

			Utils.shuffle(this.whiteCardDeck);
		}

		//return this.getWhiteCards().splice(Math.floor(Math.random() * this.getWhiteCards().length), 1)[0];

		return this.whiteCardDeck.pop();
	}

	getBlackCard(): BlackCard {
		if (this.blackCardDeck.length == 0) {
			this.decks.forEach((deck) => {
				deck.getBlackCards().forEach((card) => {
					this.blackCardDeck.push(card);
				});
			});

			Utils.shuffle(this.blackCardDeck);
		}

		return this.blackCardDeck.pop();
	}

	startGame(): GameStartResponse {
		if (this.gameState == GameState.INGAME) {
			return GameStartResponse.ALREADY_RUNNING;
		}

		if (this.getBlackCards().length < this._server.settings.minCardsRequiredToStart) {
			return GameStartResponse.NOT_ENOUGH_BLACK_CARDS;
		}

		if (this.getWhiteCards().length < this._server.settings.minCardsRequiredToStart) {
			return GameStartResponse.NOT_ENOUGH_WHITE_CARDS;
		}

		if (this.players.length < 3) {
			return GameStartResponse.NOT_ENOUGH_PLAYERS;
		}

		this.gameState = GameState.INGAME;

		this.startRound();

		return GameStartResponse.SUCCESS;
	}

	getActiveBlackCard(): BlackCard | null {
		return this.activeBlackCard;
	}

	endGame(reason: GameEndReason) {
		if (this.gameState == GameState.INGAME) {
			this.gameState = GameState.WAITING;

			this.blackCardDeck = [];
			this.whiteCardDeck = [];

			this.players.forEach((player) => {
				player.clearHand();
			});

			switch (reason) {
				case GameEndReason.WIN:
					//TODO: win message
					this.broadcastMessage("Game over", MessageType.SUCCESS);
					break;

				case GameEndReason.NOT_ENOUGH_PLAYERS:
					this.broadcastMessage("Game ended due to there not being enough players left", MessageType.WARNING);
					break;

				default:
					this.broadcastMessage("Game ended", MessageType.INFO);
					console.error("Invalid game end reason " + reason);
					break;
			}

			this.sendFullUpdate();
		}
	}

	sendGameListUpdateUpdate() {
		this._server.broadcastGameList();
	}

	sendStateUpdate(includeUser: User = null) {
		let target: User[] = [];

		this.players.forEach((p) => {
			target.push(p.getUser());
		});

		if (includeUser != null) {
			target.push(includeUser);
		}

		target.forEach((user) => {
			user.sendActiveGameState();
		});
	}

	sendFullUpdate(includeUser: User = null) {
		this.sendStateUpdate(includeUser);
		this.sendGameListUpdateUpdate();
	}
}