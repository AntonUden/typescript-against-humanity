import { cyan } from "colors";
import { Configuration } from "./config/Configuration";
import { Socket, Server as SocketServer } from 'socket.io';
import express from "express";
import { createServer as createHttpServer } from 'http';
import { DeckCollection } from "./deck/DeckCollection";
import { readDeckCollections } from "./deck/CardLoader";
import { DeckRouter } from "./routes/decks/DeckRouter";
import { User } from "./user/User";
import { isUUIDv4 } from "./utils/UUIDUtils";
import { GameSession } from "./session/GameSession";
import { SessionRouter } from "./routes/session/SessionRouter";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { authMiddleware } from "./middleware/AuthMiddleware";

export const MaxUsernameLength = 32;

export class Server {
  public readonly config: Configuration;
  public readonly express;
  public readonly socket;
  public readonly deckCollections: DeckCollection[];
  private _users: User[] = [];
  private readonly http;
  private _gameSessions: GameSession[] = [];
  public readonly jwtKey: string;
  public readonly authMiddleware;

  constructor(config: Configuration) {
    this.config = config;

    if (!existsSync("./data")) {
      console.log("Creating " + cyan("./data") + " directory");
      mkdirSync("./data");
    }

    if (!existsSync("./data/jwt.key")) {
      console.log("Generating new JWT key");
      // Generate 64 random bytes and convert to hex string
      const key = Buffer.from(Array(64).fill(0).map(() => Math.floor(Math.random() * 256))).toString("hex");
      writeFileSync("./data/jwt.key", key);
    }

    console.log("Reading JWT key");
    this.jwtKey = readFileSync("./data/jwt.key").toString().trim();
    if (this.jwtKey.length == 0) {
      throw new Error("JWT key is empty");
    }

    this.authMiddleware = authMiddleware(this);

    this.deckCollections = readDeckCollections("./decks");

    this.express = express();
    this.http = createHttpServer(this.express);

    new DeckRouter(this).register();
    new SessionRouter(this).register();

    this.socket = new SocketServer(this.http);
    this.start();

    this.socket.on("connection", (socket: Socket) => {
      let username = socket.handshake.headers["x-username"];
      let reconnectToken = socket.handshake.headers["x-reconnect-token"];

      if (isUUIDv4(reconnectToken)) {
        const targetUser = this.users.find(u => u.reconnectToken === reconnectToken);
        if (targetUser != null) {
          targetUser.reassignSocket(socket);
          if (typeof username === "string" && username.length >= 1 && username.length <= MaxUsernameLength) {
            targetUser.setUsername(username);
          }
          // Reconnect successful. return
          return;
        }
      }

      if (typeof username !== "string" || username.length < 1 || username.length > MaxUsernameLength) {
        username = "Anonymous " + Math.floor(1000 + Math.random() * 9000);
      }

      const user = new User(this, socket, username);
      this._users.push(user);
    });

    setInterval(() => {
      this.tick();
    }, 100);
  }

  public start(): void {
    this.http.listen(this.config.port, () => {
      console.log(`Server is running on port ${cyan(String(this.config.port))}`);
    });
  }

  public get users() {
    return this._users;
  }

  public get gameSessions() {
    return this._gameSessions;
  }

  private tick() {
    this.users.forEach(u => u.tick());

    this.gameSessions.filter(s => s.players.length <= 0).forEach(session => {
      console.log("Removing empty game session: " + cyan(session.uuid));
    });
    this._gameSessions = this.gameSessions.filter(s => s.players.length > 0);

    this.users.filter(u => u.disconnectTimer <= 0).forEach(user => {
      console.log("User disconnected: " + cyan(user.uuid) + " (" + cyan(user.username) + ")");
      user.removeFromActiveGame();
    });
    this._users = this.users.filter(u => u.disconnectTimer > 0); // Remove the users from the array
  }
}
