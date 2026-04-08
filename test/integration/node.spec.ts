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
    // default and named refer to the same function
    expect(processMessage).toBe(processMessageNamed);

    const jsonStr = processMessageToJsonString(EXAMPLE_MSG, 4);
    expect(typeof jsonStr).toBe("string");
    const parsed = JSON.parse(jsonStr);
    expect(parsed).toEqual(processMessage(EXAMPLE_MSG));
    // formatted with indentation -> should contain newline and 4 spaces
    expect(jsonStr).toMatch(/\n\s{4}"fullName"/);
  });

  it("propagates ValidationError when extracted patient data is invalid (missing names)", () => {
    // Craft a PRS where NAME (index 3) is empty but DOB (index 7) is present
    // Use many separators to place DOB at the correct position
    const prsLine = "PRS|1|id||||||19800101|";
    const detLine = "DET|1|I|^^Dept^101^Room|Condition";
    const msg = [prsLine, detLine].join("\n");

    expect(() => processMessage(msg)).toThrow(ValidationError);
  });

  it("propagates ValidationError when required diagnosis field is missing", () => {
    // Valid PRS but DET's diagnosis field (index 3) is empty
    const prsLine =
      "PRS|1|9876543210^^^Location^ID||Smith^John^A|||M|19800101|";
    // Create DET such that the DIAGNOSIS field (4th field after tag) is empty:
    const detLineMissingDiag = "DET|1|I||";
    const msg = [prsLine, detLineMissingDiag].join("\n");

    expect(() => processMessage(msg)).toThrow(ValidationError);
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
      // DET intentionally missing
    ].join("\n");

    expect(() => processMessage(missingDet)).toThrow(ParsingError);
    expect(() => processMessage(missingDet)).toThrow(
      /required segment not found/i,
    );
  });

  it("handles extremely malformed PRS (e.g. 'PRS||||||') by propagating validation errors", () => {
    // A very malformed PRS with many empty fields; DET present with condition
    const prsMalformed = "PRS|||||||||"; // many empty fields after tag
    const det = "DET|1|I|^^Dept^101^Room|SomeCondition";
    const msg = [prsMalformed, det].join("\n");

    // extractor will find PRS/DET but the Patient construction should fail validation
    expect(() => processMessage(msg)).toThrow(ValidationError);
  });
});
