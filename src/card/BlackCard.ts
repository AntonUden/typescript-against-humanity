import { Card } from "./Card";

export class BlackCard implements Card {
	public text: string;
	public pick: number;

	constructor(text: string, pick: number) {
		this.text = text;
		this.pick = pick;
	}

	getText(): string {
		return this.text;
	}

	getPick(): number {
		return this.pick;
	}
}