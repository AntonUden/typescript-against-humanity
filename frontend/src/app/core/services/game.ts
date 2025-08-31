import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

const ReconnectTokenKey = "cah_reconnectToken";
const UsernameKey = "cah_username";

@Injectable({
  providedIn: 'root'
})
export class Game {
  private _socket: Socket | null = null;
  private _connected = false;

  public init() {
    this.connectSocket();
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
      console.debug('Socket message received:', msg, data);
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
}
