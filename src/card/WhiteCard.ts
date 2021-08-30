import { Card } from "./Card";

export class WhiteCard implements Card {
	public text: string;

	constructor(text: string) {
		this.text = text;
	}

	getText(): string {
		return this.text;
	}
}