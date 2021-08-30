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
		if (this.players.length > this._server.settings.maxPlayersPerGame) {
			return JoinGameResponse.GAME_FULL;
		}

		for (let i = 0; i < this.players.length; i++) {
			this.players[i].getUser().sendMessage(user.getUsername() + " joined the game", MessageType.INFO);
		}

		this.players.push(new Player(this, user));

		this._server.broadcastStateChange();

		return JoinGameResponse.SUCCESS;
	}

	leaveGame(user: User) {
		for (let i: number = 0; i < this.players.length; i++) {
			if (this.players[i].getUUID() == user.getUUID()) {
				this.players.splice(i, 1);
				break;
			}
		}

		// removeGame() also calls broadcastStateChange() so no need to do it twice
		if (this.players.length == 0) {
			this._server.removeGame(this);
		} else {
			this._server.broadcastStateChange();
		}
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
}