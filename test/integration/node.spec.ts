// isla-parser/test/integration/node.spec.ts
import { describe, expect, it } from "vitest";

import processMessage, {
  processMessage as processMessageNamed,
  processMessageToJsonString,
} from "../../src/internal";
import { ParsingError } from "../../src/internal/errors/parsing-error";
import { ValidationError } from "../../src/internal/errors/validation-error";

const EXAMPLE_MSG = [
  "MSG|^~\\&|SenderSystem|Location|ReceiverSystem|Location|20230502112233||DATA^TYPE|123456|P|2.5",
  "EVT|TYPE|20230502112233",
  "PRS|1|9876543210^^^Location^ID||Smith^John^A|||M|19800101|",
  "DET|1|I|^^MainDepartment^101^Room 1|Common Cold",
].join("\n");

describe("integration: src/internal/index.ts", () => {
  it("processMessage returns the exact output shape for a valid message", () => {
    const result = processMessage(EXAMPLE_MSG);

    expect(result).toEqual({
      fullName: {
        lastName: "Smith",
        firstName: "John",
        middleName: "A",
      },
      dateOfBirth: "1980-01-01",
      primaryCondition: "Common Cold",
    });
  });

  it("default export equals named processMessage and JSON string formatting is honored", () => {
    expect(processMessage).toBe(processMessageNamed);

    const jsonStr = processMessageToJsonString(EXAMPLE_MSG, 4);
    expect(typeof jsonStr).toBe("string");
    const parsed = JSON.parse(jsonStr);
    expect(parsed).toEqual(processMessage(EXAMPLE_MSG));
    expect(jsonStr).toMatch(/\n\s{4}"fullName"/);
  });

  it("propagates ValidationError when extracted patient data is invalid", () => {
    const prsLine = "PRS|1|id||||||19800101|";
    const detLine = "DET|1|I|^^Dept^101^Room|Condition";
    const msg = [prsLine, detLine].join("\n");

    try {
      processMessage(msg);
      throw new Error("Expected processMessage to throw ValidationError");
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "fullName.firstName" }),
        ]),
      );
    }
  });

  it("propagates ValidationError when required diagnosis field is missing", () => {
    const prsLine =
      "PRS|1|9876543210^^^Location^ID||Smith^John^A|||M|19800101|";
    const detLineMissingDiag = "DET|1|I||";
    const msg = [prsLine, detLineMissingDiag].join("\n");

    try {
      processMessage(msg);
      throw new Error("Expected processMessage to throw ValidationError");
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "primaryCondition" }),
        ]),
      );
    }
  });

  it("throws ParsingError for empty message (no segments parsed)", () => {
    expect(() => processMessage("")).toThrow(ParsingError);
    expect(() => processMessage("")).toThrow(/no segments parsed/i);
  });

  it("throws ParsingError when a required segment is missing (DET)", () => {
    const missingDet = [
      "MSG|1|x",
      "EVT|1|x",
      "PRS|1||Doe^Jane^|19800101|",
    ].join("\n");

    expect(() => processMessage(missingDet)).toThrow(ParsingError);
    expect(() => processMessage(missingDet)).toThrow(
      /required segment not found/i,
    );
  });

  it("handles extremely malformed PRS by propagating validation errors", () => {
    const prsMalformed = "PRS|||||||||"; // many empty fields after tag
    const det = "DET|1|I|^^Dept^101^Room|SomeCondition";
    const msg = [prsMalformed, det].join("\n");

    try {
      processMessage(msg);
      throw new Error("Expected processMessage to throw ValidationError");
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect(Array.isArray((err as ValidationError).issues)).toBe(true);
      expect((err as ValidationError).issues.length).toBeGreaterThan(0);
    }
  });

  it("supports extra segments anywhere in the message and still extracts patient info", () => {
    const parts = EXAMPLE_MSG.split("\n");
    const prsLine = parts.find((l) => l.startsWith("PRS")) as string;
    const detLine = parts.find((l) => l.startsWith("DET")) as string;

    const msg = ["XYZ|foo", prsLine, "ABC|bar", detLine, "ZZZ|baz"].join("\n");

    const result = processMessage(msg);
    expect(result).toEqual({
      fullName: {
        lastName: "Smith",
        firstName: "John",
        middleName: "A",
      },
      dateOfBirth: "1980-01-01",
      primaryCondition: "Common Cold",
    });
  });

  it("throws or handles when PRS fields are shorter than expected", () => {
    const prsShort = "PRS|1";
    const det = "DET|1|I|^^Dept^101^Room|SomeCondition";
    const msg = [prsShort, det].join("\n");

    try {
      processMessage(msg);
      const ok = processMessage(msg);
      expect(ok).toBeTruthy();
      expect(ok.fullName).toBeDefined();
    } catch (err) {
      if (err instanceof ValidationError) {
        expect(Array.isArray(err.issues)).toBe(true);
        expect(err.issues.length).toBeGreaterThan(0);
      } else {
        expect(err).toBeInstanceOf(ParsingError);
      }
    }
  });
});
