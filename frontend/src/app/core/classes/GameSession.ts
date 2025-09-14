import { GameSettings } from "./GameSettings";

export class GameSession {
  public state: GameState;
  public readonly lobbyId: string;
  public lobbyName: string;
  public settings: GameSettings;

  constructor(lobbyId: string, lobbyName: string, settings: GameSettings) {
    this.lobbyId = lobbyId;
    this.lobbyName = lobbyName;
    this.settings = settings;
    this.state = GameState.WaitingLobby;
  }

}

export enum GameState {
  WaitingLobby = "WaitingLobby",
  InGame = "InGame",
}
