import { Server } from "../../Server";
import { GameSession } from "../../session/GameSession";
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

    this.router.post("/", this.server.authMiddleware, (req, res) => {
      try {
        const session = new GameSession(this.server);
        this.server.gameSessions.push(session);
        session.joinGame(req.user!);
        res.json(session.getSessionListData());
      } catch (err) {
        this.handleError(err, req, res);
      }
    });
  }
}
