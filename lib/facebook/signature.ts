import crypto from "crypto";

export function verifyFacebookSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string
): boolean {
  if (!signatureHeader || !appSecret) return false;

  const [algo, expected] = signatureHeader.split("=");
  if (algo !== "sha256" || !expected) return false;

  const computed = crypto.createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");

  try {
    const expectedBuf = Buffer.from(expected, "hex");
    const computedBuf = Buffer.from(computed, "hex");
    if (expectedBuf.length !== computedBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, computedBuf);
  } catch {
    return false;
  }
}
