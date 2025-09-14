export interface GameSettings {
  sessionName: string;
  passwordProtected: boolean;
  winScore: number;
  handSize: number;
  allowThrowawayCards: boolean;
  maxThrowawayCardsPerRound: number;
  showExpansionName: boolean;
}

export function generateDefaultSettings(): GameSettings {
  return {
    sessionName: "Unnamed Session",
    passwordProtected: false,
    winScore: 10,
    handSize: 10,
    allowThrowawayCards: true,
    maxThrowawayCardsPerRound: 2,
    showExpansionName: true,
  };
}
