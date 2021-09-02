import * as express from "express";
import * as socketio from "socket.io";
import * as path from "path";
import { v4 as uuidv4 } from 'uuid';
import { User } from "./User";
import { Settings } from "./interfaces/Settings";
import { Game } from "./Game";
import { MessageType } from "./enum/MessageType";
import { Deck } from "./card/Deck";
import { DeckCollection } from "./card/DeckCollection";
import { DeckCollectionReader } from "./card/DeckCollectionReader";
import { Utils } from "./Utils";
import { ITickable } from "./interfaces/ITickable";

export class Server implements ITickable {
	public settings: Settings;

	public app;
	public http;
	public io;

	public users: User[] = [];
	public games: Game[] = [];

	public deckCollections: DeckCollection[] = [];

	constructor(settings: Settings) {
		this.settings = settings;

		console.log("Reading decks...");
		this.deckCollections = DeckCollectionReader.readDeckCollections();

		this.app = express();
		this.app.set("port", settings.port);

		this.http = require("http").Server(this.app);

		this.io = require("socket.io")(this.http);

		this.app.use('/', express.static(__dirname + '/../client'));

		this.http.listen(settings.port, function () {
			console.log("Listening on port " + settings.port);
		});

		this.io.on("connection", (socket: socketio.Socket) => {
			let user: User = new User(this, uuidv4(), socket, "Anonymous " + Utils.getRandomInt(1, 9999));

			this.users.push(user);

			console.log("[User] New user connected with uuid " + user.getUUID() + " (User count: " + this.users.length + ")");

			user.sendMessage("Connected!", MessageType.SUCCESS);

			user.sendGameList();
		});

		setInterval(() => {
			this.tick();
		}, 100);
	}

	getGames(): Game[] {
		return this.games;
	}

	removeGame(game: Game) {
		console.log("[Game] Removing game instance " + game.getUUID() + " (" + game.getName() + ")");
		game.destroyInstance();
		for (let i = 0; i < this.games.length; i++) {
			if (this.games[i].getUUID() == game.getUUID()) {
				this.games.splice(i, 1);
			}
		}
		this.broadcastGameList();
	}

	createGame(owner: User, name: string): Game {
		let game: Game = new Game(this, uuidv4(), name);

		this.games.push(game);

		game.joinGame(owner);

		return game;
	}

	disconnectUser(user: User) {
		user.dispose();
		for (let i: number = 0; i < this.users.length; i++) {
			if (this.users[i].getUUID() == user.getUUID()) {
				this.users.splice(i, 1);
			}
		}
		console.log("[User] User " + user.getUUID() + " disconnected (User count: " + this.users.length + ")");
	}

	broadcastGameList() {
		for (let i = 0; i < this.users.length; i++) {
			this.users[i].sendGameList();
		}
	}

	getDeck(name: string): Deck | null {
		for (let i = 0; i < this.deckCollections.length; i++) {
			for (let j = 0; j < this.deckCollections[i].getDecks().length; j++) {
				if (this.deckCollections[i].getDecks()[j].getName() == name) {
					return this.deckCollections[i].getDecks()[j];
				}
			}
		}

		return null;
	}

	getDeckCollections(): DeckCollection[] {
		return this.deckCollections;
	}

	getGame(uuid: string): Game | null {
		for (let i = 0; i < this.games.length; i++) {
			if (this.games[i].getUUID() == uuid) {
				return this.games[i];
			}
		}

		return null;
	}

	// Called 10 times / second
	tick(): void {
		this.users.forEach((user) => user.tick());
		this.games.forEach((game) => game.tick());
	}
}