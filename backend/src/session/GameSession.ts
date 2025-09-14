import { GameSettings, generateDefaultSettings } from "./GameSettings";
import { SessionPlayer } from "./SessionPlayer";
import { v4 } from "uuid";
import { Server } from "../Server";
import { User } from "../user/User";
import { Packet } from "../packet/Packet";
import { PacketType } from "../packet/PacketType";
import { ToastNotificationType } from "../packet/data/ToastNotificationType";
import { stat } from "fs";

export class GameSession {
  private readonly server: Server;
  public readonly uuid: string;
  protected _owner: string = "00000000-0000-0000-0000-000000000000";
  private _settings: GameSettings;
  private _players: SessionPlayer[];
  private _password: string | null = null;
  private _state: GameState = GameState.Lobby;

  constructor(server: Server) {
    this.server = server;
    this.uuid = v4();
    this._settings = generateDefaultSettings();
    this._players = [];
  }

  public get settings(): GameSettings {
    return this._settings;
  }

  public get players() {
    return this._players;
  }

  public get state() {
    return this._state;
  }

  public joinGame(user: User) {
    if (this.players.length == 0) {
      this._owner = user.uuid;
    }
    user.removeFromActiveGame();
    const player = new SessionPlayer(this, user);
    this._players.push(player);

    this.broadcast({
      type: PacketType.S2CUserJoinLobby,
      data: {
        userId: user.uuid,
        username: user.username,
      }
    });

    this.broadcastState();
  }

  public leaveGame(user: User) {
    if (this._players.find(p => p.user.uuid === user.uuid) == null) {
      return;
    }

    this._players = this._players.filter(p => p.user.uuid !== user.uuid);
    this.broadcast({
      type: PacketType.S2CUserLeaveLobby,
      data: {
        userId: user.uuid,
        username: user.username,
      }
    });

    if (user.uuid === this._owner && this.players.length > 0) {
      const newOwner = this.players[0];
      this._owner = newOwner.user.uuid;
      newOwner.user.sendToastNotification("You where reassigned as the owner of the current game session because the previous owner left.", ToastNotificationType.Info);
    }

    this.broadcastState();
  }

  public broadcast(packet: Packet<any>) {
    this.players.forEach(player => {
      player.user.sendPacket(packet);
    });
  }

  public broadcastState() {
    const commonState = {
      uuid: this.uuid,
      settings: this.settings,
      owner: this._owner,
      players: this.players.map(p => ({
        userId: p.user.uuid,
        username: p.user.username,
        roundWinResults: p.roundWinResults,
      })),
    }

    this.players.forEach(player => {
      player.user.sendPacket({
        type: PacketType.S2CGameSessionState,
        data: {
          ...commonState,
          playerHand: player.playerHand
        },
      });
    });
  }

  public get sessionListData() {
    return {
      uuid: this.uuid,
      settings: this.settings,
      playerCount: this.players.length,
      hasStarted: this.state != GameState.Lobby,
    }
  }
}

export enum GameState {
  Lobby = "lobby",
  InGameSelecting = "in_game_selecting",
  InGameVoting = "in_game_voting",
}
