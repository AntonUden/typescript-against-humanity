import { Deck } from "./Deck";

export class DeckCollection {
	private name: string;
	private displayName: string;
	private description: string;

	private decks: Deck[];

	constructor(name: string, displayName: string, description: string, decks: Deck[]) {
		this.name = name;
		this.displayName = displayName;
		this.description = description;
		this.decks = decks;
	}

	getName(): string {
		return this.name;
	}

	getDisplayName(): string {
		return this.displayName;
	}

	getDescription(): string {
		return this.description;
	}

	getDecks(): Deck[] {
		return this.decks;
	}
}