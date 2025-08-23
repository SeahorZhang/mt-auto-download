import { createHmac } from "crypto";

export function hmacSHA1(message, key) {
  return createHmac("sha1", key).update(message).digest("base64");
}
