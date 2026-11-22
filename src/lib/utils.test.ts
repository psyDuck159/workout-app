import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("gộp class và để class sau ghi đè class Tailwind xung đột", () => {
    expect(cn("p-2 text-sm", false && "hidden", "p-4")).toBe("text-sm p-4");
  });
});
