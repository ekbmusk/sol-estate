// Solana SDK requires Buffer in the browser
import { Buffer } from "buffer";

if (typeof window !== "undefined") {
  (window as any).Buffer = Buffer;
}
