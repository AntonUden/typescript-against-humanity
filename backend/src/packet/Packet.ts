import { PacketType } from "./PacketType";

export interface Packet<T> {
  type: PacketType;
  data: T;
}
