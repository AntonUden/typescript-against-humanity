import { BlackCard } from "./card/BlackCard";
import { Deck } from "./card/Deck";
import { WhiteCard } from "./card/WhiteCard";
import { GameStartResponse } from "./enum/GameStartResponse";
import { GameState } from "./enum/GameState";
import { JoinGameResponse } from "./enum/JoinGameResponse";
import { MessageType } from "./enum/MessageType";
import { GameSettings } from "./interfaces/GameSettings";
import { Player } from "./Player";
import { Server } from "./Server";
import { User } from "./User";

export class Game {
	private uuid: string;
	private name: string;
	private players: Player[] = [];
	private gameState: GameState;
	private settings: GameSettings;
	private decks: Deck[] = [];
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

		this.players.push(new Player(this, user));

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

	fillPlayerHand(player: Player) {

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

		this.sendStateUpdate();
		this.sendGameListUpdateUpdate();

		return GameStartResponse.SUCCESS;
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