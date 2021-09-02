
import { throws } from "assert/strict";
import { Socket } from "socket.io";
import { Deck } from "./card/Deck";
import { WhiteCard } from "./card/WhiteCard";
import { GameStartResponse } from "./enum/GameStartResponse";
import { JoinGameResponse } from "./enum/JoinGameResponse";
import { MessageType } from "./enum/MessageType";
import { Game } from "./Game";
import { ClientSettings } from "./interfaces/ClientSettings";
import { ITickable } from "./interfaces/ITickable";
import { Player } from "./Player";
import { Server } from "./Server";

export class User implements ITickable {
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
			maxPlayerNameLength: this._server.settings.maxPlayerNameLength,
			deckCollections: this._server.getDeckCollections(),
			uuid: this.getUUID()
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

			case "leave_game":
				if (!this.isInGame()) {
					console.log("[User] User " + this.uuid + " tried to leave a game while not in one");
					this.sendMessage("You are not in a game", MessageType.WARNING);
					return;
				}

				this.getGame().leaveGame(this);

				this.sendMessage("You left the game", MessageType.INFO);
				break;


			case "test":
				//TODO: remove
				this.getGame().getPlayers().forEach((player) => {
					player.clearHand();
				});
				this.getGame().startRound();
				break;

			case "set_game_expanstions":
				if (content["expansions"] == undefined) {
					console.warn("[User] Received set_game_expanstions without expansions from " + this.uuid);
					return;
				}

				if (!this.isInGame()) {
					console.warn("[User] User " + this.uuid + " tried to set expansions while not in a game");
					this.sendMessage("You are not in a game", MessageType.WARNING);
					return;
				}

				if (!this.getGame().isHost(this)) {
					console.warn("[User] User " + this.uuid + " tried to set expansions while not being the host of the game");
					this.sendMessage("You are not the host of this game", MessageType.ERROR);
				}

				//console.debug(Object.entries(content["expansions"]));

				for (let [key, value] of Object.entries(content["expansions"])) {
					let name = key + "";
					let enabled = (value + "" == "true");

					//console.debug(name + " " + enabled);

					let deck: Deck | null = this._server.getDeck(name);

					if (deck == null) {
						console.warn("[User] User " + this.uuid + " tried to set the state of an invalid expansion");
						continue;
					}

					let hasDeck: boolean = this.getGame().hasDeck(deck);

					if (hasDeck) {
						if (!enabled) {
							console.log("[User] removing deck " + deck.getName());
							this.getGame().removeDeck(deck);
						}
					} else {
						if (enabled) {
							console.log("[User] adding deck " + deck.getName());
							this.getGame().addDeck(deck);
						}
					}

					this.getGame().sendFullUpdate();
				}

				break;

			case "start_game":
				if (!this.isInGame()) {
					console.warn("[User] User " + this.uuid + " tried to start a game while not in one");
					this.sendMessage("You are not in a game", MessageType.WARNING);
					return;
				}

				if (!this.getGame().isHost(this)) {
					console.warn("[User] User " + this.uuid + " tried to set start the game while not being the host");
					this.sendMessage("You are not the host of this game", MessageType.ERROR);
				}

				let response: GameStartResponse = this.getGame().startGame();

				switch (response) {
					case GameStartResponse.SUCCESS:
						this.getGame().broadcastMessage("Game started", MessageType.SUCCESS);
						break;

					case GameStartResponse.ALREADY_RUNNING:
						this.sendMessage("The game has already been started", MessageType.ERROR);
						break;

					case GameStartResponse.NOT_ENOUGH_PLAYERS:
						this.sendMessage("There needs to be atleast 3 players before the game can start", MessageType.ERROR);
						break;

					case GameStartResponse.NOT_ENOUGH_BLACK_CARDS:
						this.sendMessage("There are not enough black cards in the expansions you have selected. Please select more expansions and try again", MessageType.ERROR);
						break;

					case GameStartResponse.NOT_ENOUGH_WHITE_CARDS:
						this.sendMessage("There are not enough white cards in the expansions you have selected. Please select more expansions and try again", MessageType.ERROR);
						break;

					default:
						console.warn("Unknown game start response " + response);
						break;
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

	sendGameList() {
		let gameList: any[] = [];

		for (let i: number = 0; i < this._server.getGames().length; i++) {
			let game: Game = this._server.getGames()[i];

			/*let players: any[] = [];
			for (let j: number = 0; j < game.getPlayers().length; j++) {
				let player: Player = game.getPlayers()[j];

				players.push({
					uuid: player.getUUID(),
					username: player.getUser().getUsername(),
					score: player.getScore()
				});
			}*/

			let decks: string[] = [];

			game.getDecks().forEach((deck) => {
				decks.push(deck.getName());
			})

			let gameObject: any = {
				uuid: game.getUUID(),
				name: game.getName(),
				state: game.getGameState(),
				decks: decks,
				player_count: game.getPlayers().length
			};

			gameList.push(gameObject);
		}

		let state = {
			games: gameList
		}

		this.socket.send("game_list", state);
	}

	sendActiveGameState() {
		let activeGameData: any | null = null;

		if (this.isInGame()) {
			let game: Game = this.getGame();

			let decks: string[] = [];

			game.getDecks().forEach((deck) => {
				decks.push(deck.getName());
			});

			let players: any[] = [];

			game.getPlayers().forEach((player) => {
				players.push({
					uuid: player.getUUID(),
					username: player.getUser().getUsername(),
					score: player.getScore()
				});
			});

			let player: Player = game.getPlayers().find((p) => p.getUUID() == this.getUUID());

			let hand: string[] = [];

			if (player != null) {
				hand = player.getHand();
			}

			activeGameData = {
				uuid: game.getUUID(),
				name: game.getName(),
				state: game.getGameState(),
				decks: decks,
				host: game.getHostUUID(),
				players: players,
				black_card: game.getActiveBlackCard(),
				hand: hand
			};
		}

		let state = {
			active_game: activeGameData
		}

		this.socket.send("state", state);
	}

	tick(): void {

	}
}