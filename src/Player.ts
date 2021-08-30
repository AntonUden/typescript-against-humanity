import { Game } from "./Game";
import { User } from "./User";

export class Player {
	private user: User;
	private _game: Game;



	constructor(game: Game, user: User) {
		this.user = user;
		this._game = game;
	}

	getUser(): User {
		return this.user;
	}

	getUUID(): string {
		return this.user.getUUID();
	}
}