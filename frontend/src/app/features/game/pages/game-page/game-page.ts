import { Component } from '@angular/core';
import { Game } from '../../../../core/services/game';
import { LobbyPage } from "../lobby-page/lobby-page";
import { GameWaitingLobbyPage } from "../game-waiting-lobby-page/game-waiting-lobby-page";
import { InGamePage } from "../in-game-page/in-game-page";

@Component({
  selector: 'app-game-page',
  imports: [LobbyPage, GameWaitingLobbyPage, InGamePage],
  templateUrl: './game-page.html',
  styleUrl: './game-page.scss'
})
export class GamePage {
  constructor(
    protected game: Game,
  ) { }

  protected get hasSession() {
    return this.game.activeSession != null;
  }

  protected get isInWaitingLobby() {
    return this.game.activeSession?.state == "WaitingLobby";
  }
}
