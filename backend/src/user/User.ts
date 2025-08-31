import { v4 } from "uuid";
import { Server } from "../Server";
import { Socket } from "socket.io";
import { cyan } from "colors";
import { Packet } from "../packet/Packet";
import { PacketType } from "../packet/PacketType";

const DisconnectTimerValue = 60 * 10; // 10 seconds in ticks

export class User {
  public readonly uuid: string;
  public readonly reconnectToken: string;
  private readonly server: Server;
  private _socket: Socket | null;
  private _disconnectTimer: number = DisconnectTimerValue;
  private _disconnected = false;
  private _username: string;

  constructor(server: Server, socket: Socket, username: string) {
    this.uuid = v4();
    this.reconnectToken = v4();
    this.server = server;
    this._socket = socket;
    this._username = username;

    console.log("New user connected. Assigned id: " + cyan(this.uuid) + " Username: " + cyan(this.username));

    this.handleSocketConnected(ConnectionType.NewConnection);
  }

  public reassignSocket(newSocket: Socket) {
    this._socket?.disconnect(true);
    this._socket = newSocket;

    console.log("Reassigned socket connection for user: " + cyan(this.uuid));

    this.handleSocketConnected(ConnectionType.Reconnection);
  }

  private handleSocketConnected(type: ConnectionType) {
    if (!this._socket) {
      throw new Error("Socket is not assigned");
    }
    this._disconnected = false;
    this._disconnectTimer = DisconnectTimerValue;

    this._socket.on("disconnect", () => {
      console.log("User " + cyan(this.uuid) + " (" + cyan(this.username) + ") lost connection. Starting disconnect timer");
      this._disconnected = true;
    });

    this.sendPacket({
      type: PacketType.S2CConnectionAck,
      data: {
        type,
        reconnectToken: this.reconnectToken,
        username: this.username,
      }
    })
  }

  public setUsername(name: string) {
    this._username = name;
    this.sendPacket({
      type: PacketType.S2CUsernameSet,
      data: this.username,
    })
  }

  public sendPacket(packet: Packet<any>) {
    if (!this.socket || this.disconnected) {
      return false;
    }
    this.socket.send("message", packet)
    return true;
  }

  public get socket() {
    return this._socket;
  }

  public get disconnected() {
    return this._disconnected;
  }

  public get disconnectTimer() {
    return this._disconnectTimer;
  }

  public get username() {
    return this._username;
  }

  public tick() {
    if (this._disconnected) {
      this._disconnectTimer--;
    }
  }
}

enum ConnectionType {
  NewConnection = "new_connection",
  Reconnection = "reconnection",
}
