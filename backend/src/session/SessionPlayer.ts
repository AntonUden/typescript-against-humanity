import { BlackCard } from "../deck/card/BlackCard";
import { WhiteCard } from "../deck/card/WhiteCard";
import { User } from "../user/User";
import { GameSession } from "./GameSession";

export class SessionPlayer {
  public readonly session: GameSession;
  public readonly user: User;

  public playerHand: BlackCard[];
  public roundWinResults: PlayerRoundWinResult[];

  constructor(session: GameSession, user: User) {
    this.session = session;
    this.user = user;
    this.playerHand = [];
    this.roundWinResults = [];
  }
}

export interface PlayerRoundWinResult {
  whiteCard: WhiteCard;
  blackCards: BlackCard[];
}
