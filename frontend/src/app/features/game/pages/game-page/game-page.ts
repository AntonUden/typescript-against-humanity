import { Component } from '@angular/core';
import { Game } from '../../../../core/services/game';

@Component({
  selector: 'app-game-page',
  imports: [],
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
