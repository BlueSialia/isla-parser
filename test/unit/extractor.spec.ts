import { describe, expect, it } from "vitest";
import { ParsingError } from "../../src/internal/errors/parsing-error";
import extractPatient from "../../src/internal/extractor";
import { SEGMENT_DET, SEGMENT_PRS } from "../../src/internal/message-constants";

describe("extractor.extractPatient", () => {
  it("extracts patient fields from provided segments", () => {
    const prs = {
      name: SEGMENT_PRS,
      fields: [[], [], [], ["Smith", "John", "A"], [], [], [], ["19800101"]],
    };

    const det = {
      name: SEGMENT_DET,
      fields: [[], [], [], ["Common Cold"]],
    };

    const extracted = extractPatient([prs, det]);

    expect(extracted.lastName).toBe("Smith");
    expect(extracted.firstName).toBe("John");
    expect(extracted.middleName).toBe("A");
    expect(extracted.dobRaw).toBe("19800101");
    expect(extracted.primaryCondition).toBe("Common Cold");
  });

  it("treats empty middle name component as null", () => {
    const prs = {
      name: SEGMENT_PRS,
      fields: [[], [], [], ["Doe", "Jane", ""], [], [], [], ["19900101"]],
    };

    const det = {
      name: SEGMENT_DET,
      fields: [[], [], [], ["Flu"]],
    };

    const extracted = extractPatient([prs, det]);

    expect(extracted.lastName).toBe("Doe");
    expect(extracted.firstName).toBe("Jane");
    expect(extracted.middleName).toBeNull();
  });

  it("trims primaryCondition and returns empty string when no diagnosis provided", () => {
    const prs = {
      name: SEGMENT_PRS,
      fields: [[], [], [], ["X", "Y"], [], [], [], ["20000101"]],
    };

    const detEmpty = {
      name: SEGMENT_DET,
      fields: [[], [], [], [""]],
    };
    const extractedEmpty = extractPatient([prs, detEmpty]);
    expect(extractedEmpty.primaryCondition).toBe("");

    const detWithSpace = {
      name: SEGMENT_DET,
      fields: [[], [], [], ["  Influenza  "]],
    };
    const extracted = extractPatient([prs, detWithSpace]);
    expect(extracted.primaryCondition).toBe("Influenza");
  });

  it("throws ParsingError when a required segment is missing", () => {
    const det = {
      name: SEGMENT_DET,
      fields: [[], [], [], ["X"]],
    };
    expect(() => extractPatient([det])).toThrow(ParsingError);

    const prs = {
      name: SEGMENT_PRS,
      fields: [[], [], [], ["S", "J"], [], [], [], ["19700101"]],
    };
    expect(() => extractPatient([prs])).toThrow(ParsingError);
  });

  it("throws ParsingError when duplicate required segments are present", () => {
    const prs1 = {
      name: SEGMENT_PRS,
      fields: [[], [], [], ["A", "B"], [], [], [], ["19800101"]],
    };

    const prs2 = {
      name: SEGMENT_PRS,
      fields: [[], [], [], ["C", "D"], [], [], [], ["19900101"]],
    };

    const det = {
      name: SEGMENT_DET,
      fields: [[], [], [], ["X"]],
    };

    expect(() => extractPatient([prs1, prs2, det])).toThrow(ParsingError);
  });

  it("produces stable field positions when some intermediate fields are empty", () => {
    const prs = {
      name: SEGMENT_PRS,
      fields: [[], [], [], ["SoloLast", "SoloFirst"], [], [], [], []],
    };

    const det = {
      name: SEGMENT_DET,
      fields: [[], [], [], ["Thing"]],
    };

    const extracted = extractPatient([prs, det]);
    expect(extracted.lastName).toBe("SoloLast");
    expect(extracted.firstName).toBe("SoloFirst");
    expect(extracted.dobRaw).toBe("");
  });

  it("handles completely missing NAME field", () => {
    const prsShort = {
      name: SEGMENT_PRS,
      fields: [[], [], []],
    };

    const det = {
      name: SEGMENT_DET,
      fields: [[], [], [], ["Unknown"]],
    };

    const extracted = extractPatient([prsShort, det]);
    expect(extracted.lastName).toBe("");
    expect(extracted.firstName).toBe("");
    expect(extracted.middleName).toBeNull();
  });

  it("handles extremely malformed PRS with many empty fields", () => {
    const prs = {
      name: SEGMENT_PRS,
      fields: [[], [], [], [], [], [], [], [], [], []],
    };

    const det = {
      name: SEGMENT_DET,
      fields: [[], [], [], ["SomeCondition"]],
    };

    const extracted = extractPatient([prs, det]);
    expect(extracted.lastName).toBe("");
    expect(extracted.firstName).toBe("");
    expect(extracted.middleName).toBeNull();
    expect(extracted.dobRaw).toBe("");
  });
});
