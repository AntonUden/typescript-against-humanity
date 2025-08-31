import { validate, version } from "uuid";

export function isUUIDv4(string: any) {
  if (typeof string !== "string") {
    return false;
  }

  return validate(string) && version(string) === 4;
}
