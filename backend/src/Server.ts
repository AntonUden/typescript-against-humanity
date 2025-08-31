import { cyan } from "colors";
import { Configuration } from "./config/Configuration";
import { Server as SocketServer } from 'socket.io';
import express from "express";
import { createServer as createHttpServer } from 'http';
import { DeckCollection } from "./deck/DeckCollection";
import { readDeckCollections } from "./deck/CardLoader";
import { DeckRouter } from "./routes/decks/DeckRouter";


export class Server {
  public readonly config: Configuration;
  public readonly express;
  public readonly socket;
  public readonly deckCollections: DeckCollection[];
  private readonly http;

  constructor(config: Configuration) {
    this.config = config;

    this.deckCollections = readDeckCollections("./decks");

    this.express = express();
    this.http = createHttpServer(this.express);

    new DeckRouter(this).register();

    this.socket = new SocketServer(this.http);
    this.start();
  }

  public start(): void {
    this.http.listen(this.config.port, () => {
      console.log(`Server is running on port ${cyan(String(this.config.port))}`);
    });
  }
}

