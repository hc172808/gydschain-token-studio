import { describe, it, expect } from "vitest";
import { scanFile } from "@/lib/virusScanner";

// Polyfill File for jsdom (vitest setup already gives us File, but ensure)
const makeFile = (bytes: Uint8Array | string, name: string, type: string): File => {
  const blob = new Blob([typeof bytes === "string" ? bytes : (bytes as BlobPart)], { type });
  return new File([blob], name, { type });
};

const PNG_HEADER = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const PE_HEADER  = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03]); // Windows .exe MZ header
const EICAR = "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*";

describe("virusScanner — heuristic checks", () => {
  it("flags an EICAR test file as malicious", async () => {
    const f = makeFile(EICAR, "eicar.txt", "text/plain");
    const r = await scanFile(f, { category: "any" });
    expect(r.safe).toBe(false);
    expect(r.threats.join(" ")).toMatch(/EICAR/);
  });

  it("flags an oversized image", async () => {
    const bigBuf = new Uint8Array(6 * 1024 * 1024); // 6 MB > 5 MB image limit
    bigBuf.set(PNG_HEADER, 0);
    const f = makeFile(bigBuf, "big.png", "image/png");
    const r = await scanFile(f, { category: "image" });
    expect(r.safe).toBe(false);
    expect(r.threats.some((t) => /exceeds.*limit/i.test(t))).toBe(true);
  });

  it("blocks a Windows .exe renamed to .png", async () => {
    const f = makeFile(PE_HEADER, "logo.png", "image/png");
    const r = await scanFile(f, { category: "image" });
    expect(r.safe).toBe(false);
    expect(r.threats.some((t) => /executable/i.test(t))).toBe(true);
  });

  it("accepts a clean small PNG", async () => {
    const f = makeFile(PNG_HEADER, "ok.png", "image/png");
    const r = await scanFile(f, { category: "image" });
    expect(r.safe).toBe(true);
    expect(r.threats).toHaveLength(0);
  });
});
