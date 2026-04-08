import { describe, expect, it } from "vitest";

import {
  isParsingError,
  ParsingError,
} from "../../src/internal/errors/parsing-error";
import {
  ValidationError,
  type ValidationIssue,
} from "../../src/internal/errors/validation-error";

describe("ParsingError", () => {
  it("constructs with message and options and exposes properties", () => {
    const err = new ParsingError("something went wrong", {
      code: "E_PARSE",
      segment: "PRS",
      fieldIndex: 2,
      componentIndex: 1,
      original: "raw-segment",
    });

    expect(err).toBeInstanceOf(ParsingError);
    expect(err.name).toBe("ParsingError");
    expect(err.message).toBe("something went wrong");
    expect(err.code).toBe("E_PARSE");
    expect(err.segment).toBe("PRS");
    expect(err.fieldIndex).toBe(2);
    expect(err.componentIndex).toBe(1);
    expect(err.original).toBe("raw-segment");
  });

  it("toJSON returns serializable object including stack and provided fields", () => {
    const err = new ParsingError("oops", { code: "X" });
    const json = err.toJSON();

    expect(json).toHaveProperty("name", "ParsingError");
    expect(json).toHaveProperty("message", "oops");
    expect(json).toHaveProperty("code", "X");
    expect(json).toHaveProperty("stack");
    // stack should be a string (or undefined in some runtimes), but we expect it to be present
    expect(typeof json.stack === "string" || json.stack === undefined).toBe(
      true,
    );
  });

  it("fromUnknown returns the same instance if already a ParsingError", () => {
    const original = new ParsingError("already parsing");
    const converted = ParsingError.fromUnknown(original);
    expect(converted).toBe(original);
  });

  it("fromUnknown converts Error to ParsingError preserving message", () => {
    const err = new Error("regular error");
    const converted = ParsingError.fromUnknown(err);
    expect(converted).toBeInstanceOf(ParsingError);
    expect(converted.message).toBe("regular error");
  });

  it("fromUnknown converts non-error values to ParsingError with stringified message", () => {
    const value = 12345;
    const converted = ParsingError.fromUnknown(value);
    expect(converted).toBeInstanceOf(ParsingError);
    expect(converted.message).toBe("12345");
  });

  it("isParsingError returns true for instances and objects with name 'ParsingError'", () => {
    const instance = new ParsingError("x");
    expect(isParsingError(instance)).toBe(true);

    const objLike = { name: "ParsingError" };
    expect(isParsingError(objLike)).toBe(true);

    const notErr = { name: "SomethingElse" };
    expect(isParsingError(notErr)).toBe(false);

    expect(isParsingError(null)).toBe(false);
    expect(isParsingError(undefined)).toBe(false);
  });
});

describe("ValidationError", () => {
  it("constructs with default message and empty issues", () => {
    const ve = new ValidationError();
    expect(ve).toBeInstanceOf(ValidationError);
    expect(ve.name).toBe("ValidationError");
    expect(ve.message).toBe("Validation failed");
    expect(Array.isArray(ve.issues)).toBe(true);
    expect(ve.issues.length).toBe(0);
    expect(ve.isEmpty()).toBe(true);
  });

  it("constructs with provided issues and reports non-empty", () => {
    const issues: ValidationIssue[] = [
      { field: "a", message: "bad" },
      { field: "b", message: "also bad" },
    ];
    const ve = new ValidationError("bad things", issues);
    expect(ve.message).toBe("bad things");
    expect(ve.issues).toHaveLength(2);
    expect(ve.isEmpty()).toBe(false);
  });

  it("addIssue appends an issue to issues array", () => {
    const ve = new ValidationError();
    expect(ve.isEmpty()).toBe(true);

    ve.addIssue({ field: "x", message: "wrong" });
    expect(ve.issues).toHaveLength(1);
    expect(ve.issues[0]).toEqual({ field: "x", message: "wrong" });
    expect(ve.isEmpty()).toBe(false);

    ve.addIssue({ message: "no field provided" });
    expect(ve.issues).toHaveLength(2);
    expect(ve.issues[1]).toEqual({ message: "no field provided" });
  });

  it("toJSON returns expected serializable shape", () => {
    const ve = new ValidationError("oops", [{ field: "f", message: "fail" }]);
    const json = ve.toJSON();
    expect(json).toHaveProperty("name", "ValidationError");
    expect(json).toHaveProperty("message", "oops");
    expect(json).toHaveProperty("issues");
    expect(Array.isArray(json.issues)).toBe(true);
    expect(json.issues[0]).toEqual({ field: "f", message: "fail" });
  });

  it("isValidationError recognizes instances and objects named 'ValidationError'", () => {
    expect(ValidationError.isValidationError(new ValidationError())).toBe(true);
    expect(ValidationError.isValidationError({ name: "ValidationError" })).toBe(
      true,
    );
    expect(ValidationError.isValidationError({ name: "SomethingElse" })).toBe(
      false,
    );
    expect(ValidationError.isValidationError(null)).toBe(false);
  });
});
