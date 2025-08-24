import { Deck } from "./Deck";

export class DeckCollection {
  public readonly decks: Deck[];
  public readonly name: string;
  public readonly displayName: string;
  public readonly description: string;

  constructor(name: string, displayName: string, description: string, decks: Deck[]) {
    this.name = name;
    this.displayName = displayName;
    this.description = description;
    this.decks = decks;
  }
}
