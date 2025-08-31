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

const MaxUsernameLength = 32;


export class Server {
  public readonly config: Configuration;
  public readonly express;
  public readonly socket;
  public readonly deckCollections: DeckCollection[];
  private _users: User[] = [];
  private readonly http;

  constructor(config: Configuration) {
    this.config = config;

    this.deckCollections = readDeckCollections("./decks");

    this.express = express();
    this.http = createHttpServer(this.express);

    new DeckRouter(this).register();

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

  private tick() {
    this.users.forEach(u => u.tick());

    this.users.filter(u => u.disconnectTimer <= 0).forEach(user => {
      console.log("User disconnected: " + cyan(user.uuid) + " (" + cyan(user.username) + ")");
      //TODO: Disconnect user
    });

    this._users = this.users.filter(u => u.disconnectTimer > 0); // Remove the users from the array
  }
}
