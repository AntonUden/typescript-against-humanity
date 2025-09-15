import { Injectable } from "@angular/core";
import { Game } from "../game";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class SessionApi {
  constructor(
    private game: Game,
    private http: HttpClient,
  ) { }

  public createNewSession() {
    return this.http.post<{ sessionId: string }>(environment.apiBaseUrl + "/sessions", {}, {
      headers: {
        "Authorization": `Bearer ${this.game.accessToken}`
      }
    });
  }
}
