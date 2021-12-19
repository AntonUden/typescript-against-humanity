import { BlackCard } from "./BlackCard";
import { WhiteCard } from "./WhiteCard";

export class Deck {
	private name: string;
	private displayName: string;
	private order: number;
	private blackCards: BlackCard[] = [];
	private whiteCards: WhiteCard[] = [];


	constructor(name: string, displayName: string, order: number) {
		this.name = name;
		this.displayName = displayName;
		this.order = order;
		this.blackCards = [];
		this.whiteCards = [];
	}

	setContent(blackCards: BlackCard[], whiteCards: WhiteCard[]) {
		this.blackCards = blackCards;
		this.whiteCards = whiteCards;
	}

	getName(): string {
		return this.name;
	}

	getDisplayName(): string {
		return this.displayName;
	}

	getOrder(): number {
		return this.order;
	}

	getBlackCards(): BlackCard[] {
		return this.blackCards;
	}

	getWhiteCards(): WhiteCard[] {
		return this.whiteCards;
	}
}