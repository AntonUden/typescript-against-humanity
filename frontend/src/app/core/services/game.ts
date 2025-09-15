import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { Packet } from '../packet/Packet';
import { PacketType } from '../packet/PacketType';
import { ToastrService } from 'ngx-toastr';
import { GameSession } from '../classes/GameSession';

const ReconnectTokenKey = "cah_reconnectToken";
const UsernameKey = "cah_username";

@Injectable({
  providedIn: 'root'
})
export class Game {
  private _socket: Socket | null = null;
  private _connected = false;
  private _packetReceivedSubject = new Subject<Packet<any>>();
  private _username = "Anonymous";
  private _activeSession: GameSession | null = null;
  private _accessToken = "";

  public get activeSession() {
    return this._activeSession;
  }

  constructor(
    private toastr: ToastrService,
  ) {
    this.packetReceived$.subscribe(packet => {
      if (packet.type == PacketType.S2CConnectionAck) {
        const connectionType = packet.data.type as ConnectionType;
        console.log("Server acknowledged connection. type: " + connectionType);
        const reconnectToken = packet.data.reconnectToken;
        console.debug("Reconnect token: " + reconnectToken);
        localStorage.setItem(ReconnectTokenKey, reconnectToken);

        this._accessToken = String(packet.data.accessToken);
        console.debug("Access token: " + this._accessToken);

        if (connectionType == ConnectionType.Reconnection) {
          console.log("Reconnect successful");
          this.toastr.success("Reconnected successfully");
        } else {
          this.toastr.success("Connected");
        }

        this._username = String(packet.data.username);
        console.log("Username set to: " + this.username);
        localStorage.setItem(UsernameKey, this.username);
      } else if (packet.type == PacketType.S2CUsernameSet) {
        const username = String(packet.data);
        console.log("Username set to: " + username);
        this.toastr.info("Username set to: " + username);
        this._username = username;
        localStorage.setItem(UsernameKey, this.username);
      }
    });
  }

  public init() {
    this.connectSocket();
  }

  public get accessToken() {
    return this._accessToken;
  }

  private get socketHeaders() {
    const headers: { [key: string]: string } = {};
    if (localStorage.getItem(ReconnectTokenKey)) {
      headers["x-reconnect-token"] = localStorage.getItem(ReconnectTokenKey) as string;
    }
    if (localStorage.getItem(UsernameKey)) {
      headers["x-username"] = localStorage.getItem(UsernameKey) as string;
    }
    return headers;
  }

  public get packetReceived$() {
    return this._packetReceivedSubject.asObservable();
  }

  public connectSocket() {
    console.log("Game::connectSocket()");
    if (this._socket != null) {
      this._connected = false;
      console.debug("Existing socket variable found");
      this.disconnectSocket();
    }

    this._socket = io({
      reconnection: true,
      extraHeaders: this.socketHeaders,
    });

    this._socket.on('connect', () => {
      console.log('Socket connected');
      this._connected = true;
    });

    this._socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    this._socket.on('disconnect', (reason) => {
      console.warn('Socket disconnected:', reason);
      this._connected = false;
    });

    this._socket.on('message', (msg: string, data: any) => {
      if (msg == "message") {
        //TODO: remove log
        console.debug("Received packet: ", data);
        this._packetReceivedSubject.next(data as Packet<any>);
      }
    });

    this._socket.on('reconnect_attempt', () => {
      if (this._socket != null) {
        this._socket.io.opts.extraHeaders = this.socketHeaders;
      }
    });
  }

  public disconnectSocket() {
    if (this._socket != null) {
      console.log("Disconnecting socket");
      this._socket.disconnect();
      this._socket = null;
    }
  }

  public get connected() {
    return this._connected;
  }

  public get socket() {
    return this._socket;
  }

  public get username() {
    return this._username;
  }
}

enum ConnectionType {
  NewConnection = "new_connection",
  Reconnection = "reconnection",
}
