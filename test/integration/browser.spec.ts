// If specific functionality for browser is added we test it here.

import { describe, expect, it } from "vitest";

import { processMessage, processMessageToJsonString } from "../../src/browser";

describe("browser adapter", () => {
  it("placeholder test", () => {
    expect(typeof processMessage).toBe("function");
    expect(typeof processMessageToJsonString).toBe("function");
  });
});
