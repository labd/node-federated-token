import { randomBytes } from "crypto";
import { createHash } from "node:crypto";

export const generateFingerprint = (): string => {
  const length = 32;
  const buffer = randomBytes(Math.ceil(length / 2));
  return buffer.toString("hex").slice(0, length);
};

export const hashFingerprint = (fingerprint: string): string => {
  const hash = createHash("sha256");
  hash.update(fingerprint);
  return hash.digest("hex");
};

export const validateFingerprint = (
  fingerprint: string,
  hashedFingerprint: string
) => hashFingerprint(fingerprint) === hashedFingerprint;
