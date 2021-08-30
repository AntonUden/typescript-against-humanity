import { Game } from "./Game";
import { User } from "./User";

export class Player {
	private user: User;
	private score: number;
	private hand: string[];
	private _game: Game;



	constructor(game: Game, user: User) {
		this.user = user;
		this.score = 0;
		this.hand = [];
		this._game = game;
	}

	getHand(): string[] {
		return this.hand;
	}

	clearHand() {
		this.hand = [];
	}

	getScore(): number {
		return this.score;
	}

	setScore(score: number) {
		this.score = score;
	}

	getUser(): User {
		return this.user;
	}

	getUUID(): string {
		return this.user.getUUID();
	}
}