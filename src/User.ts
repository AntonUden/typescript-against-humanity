
import { Socket } from "socket.io";
import { JoinGameResponse } from "./enum/JoinGameResponse";
import { MessageType } from "./enum/MessageType";
import { Game } from "./Game";
import { ClientSettings } from "./interfaces/ClientSettings";
import { Player } from "./Player";
import { Server } from "./Server";

export class User {
	private socket: Socket;
	private uuid: string;
	private username: string;
	private _server: Server;

	constructor(server: Server, uuid: string, socket: Socket, username: string) {
		this._server = server;
		this.uuid = uuid;
		this.socket = socket;
		this.username = username;

		socket.on("disconnect", () => {
			this._server.disconnectUser(this);
		});

		socket.on("message", (message: string, content: any) => {
			this.handleIncommingMessage(message, content);
		});

		let clientSettings: ClientSettings = {
			maxPlayersPerGame: this._server.settings.maxPlayersPerGame,
			maxGameNameLength: this._server.settings.maxGameNameLength,
			maxPlayerNameLength: this._server.settings.maxPlayerNameLength
		}

		socket.send("client_settings", clientSettings);
	}

	getUUID(): string {
		return this.uuid;
	}

	getSocket(): Socket {
		return this.socket;
	}

	getUsername(): string {
		return this.username;
	}

	setUsername(username: string) {
		this.username = username;
	}

	sendMessage(message: string, type: MessageType) {
		this.socket.send("message", {
			"message": message,
			"type": type
		});
	}

	getGame(): Game | null {
		for (let i: number = 0; i < this._server.games.length; i++) {
			let game = this._server.games[i];

			if (game.isInGame(this)) {
				return game;
			}
		}

		return null;
	}

	isInGame(): boolean {
		return this.getGame() != null;
	}

	handleIncommingMessage(message: string, content: any) {
		let msgString: string = "" + message;
		switch (msgString) {

			case "create_game":
				if (content["game_name"] == undefined) {
					console.warn("[User] Received create_game without game_name from " + this.uuid);
					return;
				}

				if (this.isInGame()) {
					console.log("[User] User " + this.uuid + " tried to create a game while already in one");
					this.sendMessage("You are already in a game", MessageType.WARNING);
					return;
				}

				let gameName = "" + content["game_name"];
				if (gameName.length == 0 || gameName.length > this._server.settings.maxGameNameLength) {
					console.log("[User] User " + this.uuid + " tried to create a game with an invalid name");
					this.sendMessage("Invalid game name", MessageType.WARNING);
					return;
				}

				console.log("[Game] User " + this.uuid + " created a game named " + gameName);
				this._server.createGame(this, gameName);

				break;

			case "join_game":
				if (content["uuid"] == undefined) {
					console.warn("[User] Received create_game without game_name from " + this.uuid);
					return;
				}

				if (this.isInGame()) {
					console.log("[User] User " + this.uuid + " tried to join a game while already in one");
					this.sendMessage("You are already in a game", MessageType.WARNING);
					return;
				}

				let uuid = "" + content["uuid"];
				let game: Game = this._server.getGame(uuid);
				let password: string | null = content["password"] != undefined ? content["password"] : null;

				if (game != null) {
					let response: JoinGameResponse = game.joinGame(this, password);
					if (response == JoinGameResponse.SUCCESS) {
						this.sendMessage("Joined " + game.getName(), MessageType.SUCCESS);
					} else if (response == JoinGameResponse.GAME_FULL) {
						this.sendMessage("That game is full", MessageType.ERROR);
					} else if (response == JoinGameResponse.INVALID_PASSWORD) {
						this.sendMessage("Invalid password", MessageType.ERROR);
					}
				} else {
					this.sendMessage("Game not found", MessageType.ERROR);
				}

				break;

			default:
				console.warn("[User] Invalid message received: " + message);
				break;
		}
	}

	dispose() {
		if (this.isInGame()) {
			this.getGame().leaveGame(this);
		}
	}

	sendGameState() {
		let activeGame: string | null = null;

		if (this.isInGame()) {
			activeGame = this.getGame().getUUID();
		}

		let gameList: any[] = [];

		for (let i: number = 0; i < this._server.getGames().length; i++) {
			let game: Game = this._server.getGames()[i];

			let players: any[] = [];
			for (let j: number = 0; j < game.getPlayers().length; j++) {
				let player: Player = game.getPlayers()[j];

				players.push({
					uuid: player.getUUID(),
					username: player.getUser().getUsername()
				});
			}

			gameList.push({
				uuid: game.getUUID(),
				name: game.getName(),
				state: game.getGameState(),
				players: players
			});
		}

		let state = {
			active_game: activeGame,
			games: gameList
		}

		this.socket.send("state", state);
	}
}