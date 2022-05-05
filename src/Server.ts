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
import { GameSettings } from "./interfaces/GameSettings";

export class Server implements ITickable {
	public settings: Settings;

	public app;
	public http;
	public io;

	public users: User[] = [];
	public games: Game[] = [];

	public deckCollections: DeckCollection[] = [];

	public defaultGameSettings: GameSettings = {
		handSize: 10,
		winScore: 10,
		maxRoundTime: 60,
		allowThrowingAwayCards: false,
		showCardPack: false
	};

	constructor(settings: Settings) {
		this.settings = settings;

		console.log("Reading decks...");
		this.deckCollections = DeckCollectionReader.readDeckCollections();

		let totalWhite = 0;
		let totalBlack = 0;

		this.deckCollections.forEach(dc => {
			dc.decks.forEach(d => {
				totalBlack += d.getBlackCards().length;
				totalWhite += d.getWhiteCards().length;
			});
		});

		console.log(totalWhite + " white cards loaded");
		console.log(totalBlack + " black cards loaded");

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

	public getGames(): Game[] {
		return this.games;
	}

	public removeGame(game: Game): void {
		console.log("[Game] Removing game instance " + game.getUUID() + " (" + game.getName() + ")");
		game.destroyInstance();
		for (let i = 0; i < this.games.length; i++) {
			if (this.games[i].getUUID() == game.getUUID()) {
				this.games.splice(i, 1);
			}
		}
		this.broadcastGameList();
	}

	public createGame(owner: User, name: string, password: string | null = null): Game {
		let game: Game = new Game(this, uuidv4(), name, password);

		this.games.push(game);

		game.joinGame(owner, null, true);

		return game;
	}

	public disconnectUser(user: User): void {
		user.dispose();
		for (let i: number = 0; i < this.users.length; i++) {
			if (this.users[i].getUUID() == user.getUUID()) {
				this.users.splice(i, 1);
			}
		}
		console.log("[User] User " + user.getUUID() + " disconnected (User count: " + this.users.length + ")");
	}

	public broadcastGameList(): void {
		for (let i = 0; i < this.users.length; i++) {
			this.users[i].sendGameList();
		}
	}

	public getDeck(name: string): Deck | null {
		for (let i = 0; i < this.deckCollections.length; i++) {
			for (let j = 0; j < this.deckCollections[i].getDecks().length; j++) {
				if (this.deckCollections[i].getDecks()[j].getName() == name) {
					return this.deckCollections[i].getDecks()[j];
				}
			}
		}

		return null;
	}

	public getDeckCollections(): DeckCollection[] {
		return this.deckCollections;
	}

	public getGame(uuid: string): Game | null {
		for (let i = 0; i < this.games.length; i++) {
			if (this.games[i].getUUID() == uuid) {
				return this.games[i];
			}
		}

		return null;
	}

	// Called 10 times / second
	public tick(): void {
		this.users.forEach((user) => user.tick());
		this.games.forEach((game) => game.tick());
	}
}