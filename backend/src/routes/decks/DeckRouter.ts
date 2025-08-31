import { Server } from "../../Server";
import { AbstractRouter } from "../AbstractRouter";

export class DeckRouter extends AbstractRouter {
  constructor(server: Server) {
    super(server, "/decks");

    this.router.get("/collections", (_, res) => {
      res.send(this.server.deckCollections);
    });
  }
}
