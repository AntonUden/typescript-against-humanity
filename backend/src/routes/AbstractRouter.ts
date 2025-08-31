import { Request, Response, Router } from "express";
import { cyan, yellow } from "colors";
import { Server } from "../Server";

export abstract class AbstractRouter {
  protected readonly server;
  protected readonly router;
  protected readonly path;
  private registerCalled = false;

  constructor(server: Server, path: string) {
    this.server = server;
    this.path = path;
    this.router = Router();
  }

  public register() {
    if (this.registerCalled) {
      console.warn(yellow("Attempted to call register twice in endpoint " + this.path));
      return;
    }

    this.registerCalled = true;
    console.log("Registering endpoint " + cyan(this.path));
    this.server.express.use(this.path, this.router);
  }

  protected handleError(err: any, req: Request, res: Response) {
    console.error("An error occured in endpoint " + req.path + ".", err);
    if (!res.headersSent) {
      res.status(500).send({
        message: "An internal error occured",
      });
    }
  }
}
