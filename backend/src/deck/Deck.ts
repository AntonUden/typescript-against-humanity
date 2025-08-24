import { BlackCard } from "./card/BlackCard";
import { WhiteCard } from "./card/WhiteCard";

export class Deck {
  public readonly order: number;
  public readonly name: string;
  public readonly displayName: string;
  public readonly whiteCards: WhiteCard[];
  public readonly blackCards: BlackCard[];

  constructor(
    order: number,
    name: string,
    displayName: string,
    whiteCards: WhiteCard[],
    blackCards: BlackCard[],
  ) {
    this.order = order;
    this.name = name;
    this.displayName = displayName;
    this.whiteCards = whiteCards;
    this.blackCards = blackCards;
  }
}
