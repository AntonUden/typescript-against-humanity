import { Component } from '@angular/core';
import { SessionApi } from '../../../../core/services/api/SessionApi';

@Component({
  selector: 'app-lobby-page',
  imports: [],
  templateUrl: './lobby-page.html',
  styleUrl: './lobby-page.scss'
})
export class LobbyPage {

  // TODO: remove test
  constructor(
    protected sessionApi: SessionApi,
  ) {
    setTimeout(() => {
      this.sessionApi.createNewSession().subscribe();
    }, 2000);
  }
}
