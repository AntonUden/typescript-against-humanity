import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

const ReconnectTokenKey = "cah_reconnectToken";

@Injectable({
  providedIn: 'root'
})
export class Game {
  private _socket: Socket | null = null;
  private _connected = false;

  public init() {
    this.connectSocket();
  }

  public connectSocket() {
    const headers: { [key: string]: string } = {};
    if (localStorage.getItem(ReconnectTokenKey)) {
      headers[ReconnectTokenKey] = localStorage.getItem(ReconnectTokenKey) as string;
    }
    console.log("Game::connectSocket()");
    if (this._socket != null) {
      this._connected = false;
      console.debug("Existing socket variable found");
      this.disconnectSocket();
    }

    this._socket = io({
      reconnection: true,
      extraHeaders: {
        ...headers,
      },
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

    this._socket.on('message', (msg: any) => {
      console.debug('Socket message received:', msg);
    });

    this._socket.on('reconnect_attempt', () => {
      if (this._socket != null) {
        this._socket.io.opts.extraHeaders = {
          ...headers,
        };
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
