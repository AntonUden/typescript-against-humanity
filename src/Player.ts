import { WhiteCard } from "./card/WhiteCard";
import { Game } from "./Game";
import { User } from "./User";

export class Player {
	private user: User;
	private score: number;
	private hand: string[];
	private _game: Game;
	private selectedCards: string[];

	constructor(game: Game, user: User) {
		this.user = user;
		this.score = 0;
		this.hand = [];
		this.selectedCards = [];
		this._game = game;
	}

	getHand(): string[] {
		return this.hand;
	}

	clearHand(): void {
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

	clearSelectedCards(): void {
		this.selectedCards = [];
	}

	getSelectedCards(): string[] {
		return this.selectedCards;
	}

	setSelectedCards(selected: string[]): void {
		this.selectedCards = selected;
		this._game.onPlayerSelectCards(this);
	}
}