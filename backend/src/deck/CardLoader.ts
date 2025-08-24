import { cyan } from "colors";
import { resolve } from "path";
import z from "zod";
import { DeckCollection } from "./DeckCollection";
import { existsSync, readdirSync, readFileSync } from "fs";
import { WhiteCard } from "./card/WhiteCard";
import { BlackCard } from "./card/BlackCard";
import { v4 } from "uuid";
import { Deck } from "./Deck";

export function readDeckCollections(path: string): DeckCollection[] {
  const deckFolder = resolve(path);
  console.log("Reading decks from folder " + cyan(deckFolder));
  const collectionsJson = JSON.parse(readFileSync(deckFolder + "/collections.json").toString());
  const parsedCollections = DeckCollectionModel.parse(collectionsJson);

  const result: DeckCollection[] = [];

  parsedCollections.forEach((collection) => {
    console.log("Processing collection " + cyan(collection.name));
    const collectionPath = resolve(deckFolder, collection.name);
    if (!existsSync(collectionPath)) {
      throw new Error("Collection path does not exist: " + collectionPath);
    }

    const decks: Deck[] = [];

    const deckFiles = readdirSync(collectionPath).filter(file => file.endsWith(".json"));
    deckFiles.forEach(deckFile => {
      const deckJson = JSON.parse(readFileSync(resolve(collectionPath, deckFile)).toString());
      const parsedDeck = DeckModel.parse(deckJson);

      const whiteCards: WhiteCard[] = [];
      const blackCards: BlackCard[] = [];

      parsedDeck.whiteCards.forEach(card => {
        const id = v4();
        whiteCards.push(new WhiteCard(id, card.text, card.pick, card.renderHtml ?? false));
      });

      parsedDeck.blackCards.forEach(card => {
        const id = v4();
        blackCards.push(new BlackCard(id, card.text, card.renderHtml ?? false));
      });

      const deck = new Deck(
        parsedDeck.order,
        parsedDeck.name,
        parsedDeck.displayName,
        whiteCards,
        blackCards,
      );

      if (decks.some(existingDeck => existingDeck.name === deck.name)) {
        throw new Error("Deck name is already in use: " + deck.name);
      }

      console.log("Adding deck " + cyan(deck.name));
      decks.push(deck);
    });

    const loadedCollection = new DeckCollection(
      collection.name,
      collection.displayName,
      collection.description,
      decks
    );

    result.push(loadedCollection);
  });

  const totalWhite = result.map(i => i.decks).flat().map(i => i.whiteCards.length).reduce((a, b) => a + b, 0);
  const totalBlack = result.map(i => i.decks).flat().map(i => i.blackCards.length).reduce((a, b) => a + b, 0);
  console.log("Total white cards: " + cyan(String(totalWhite)));
  console.log("Total black cards: " + cyan(String(totalBlack)));

  console.log("Loaded " + cyan(String(result.length)) + " deck collections and " + cyan(String(result.map(i => i.decks).flat().length)) + " decks.");

  return result;
}

const DeckCollectionModel = z.array(z.object({
  name: z.string(),
  displayName: z.string(),
  description: z.string(),
}));

const DeckModel = z.object({
  order: z.number(),
  name: z.string(),
  displayName: z.string(),
  blackCards: z.array(z.object({
    text: z.string(),
    renderHtml: z.boolean().optional(),
  })),
  whiteCards: z.array(z.object({
    text: z.string(),
    pick: z.number().min(1).int(),
    renderHtml: z.boolean().optional(),
  })),
});
