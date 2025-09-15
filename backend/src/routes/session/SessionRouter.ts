import { Server } from "../../Server";
import { AbstractRouter } from "../AbstractRouter";

export class SessionRouter extends AbstractRouter {
  constructor(server: Server) {
    super(server, "/sessions");

    this.router.get("/", (req, res) => {
      try {
        res.json(this.server.gameSessions.map(s => s.getSessionListData()));
      } catch (err) {
        this.handleError(err, req, res)
      }
    });
  }
}
