import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Game } from './core/services/game';
import { NavbarComponent } from "./features/navbar/components/navbar-component/navbar-component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  constructor(
    private game: Game
  ) { }

  ngOnInit() {
    this.game.init();
  }
}
