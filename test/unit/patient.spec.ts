import { describe, expect, it } from "vitest";

import { ValidationError } from "../../src/internal/errors/validation-error";
import {
  type BuildPatientArgs,
  Patient,
} from "../../src/internal/models/patient";

describe("Patient (unit)", () => {
  it("constructs and serializes a valid patient, trimming values and formatting date (UTC)", () => {
    const args: BuildPatientArgs = {
      lastName: "  Smith  ",
      firstName: " John ",
      middleName: "  A  ",
      dobRaw: "19800102",
      primaryCondition: "  Common Cold  ",
    };

    const p = new Patient(args);
    const json = p.toJSON();

    expect(json).toEqual({
      fullName: {
        lastName: "Smith",
        firstName: "John",
        middleName: "A",
      },
      dateOfBirth: "1980-01-02",
      primaryCondition: "Common Cold",
    });
  });

  it("accepts null middleName and treats whitespace-only middleName as null", () => {
    const argsNull: BuildPatientArgs = {
      lastName: "Doe",
      firstName: "Jane",
      middleName: null,
      dobRaw: "19900115",
      primaryCondition: "Flu",
    };
    const pNull = new Patient(argsNull);
    expect(pNull.fullName.middleName).toBeNull();

    const argsEmptyString: BuildPatientArgs = {
      lastName: "Doe",
      firstName: "Jane",
      middleName: "   ",
      dobRaw: "19900115",
      primaryCondition: "Flu",
    };
    const pEmpty = new Patient(argsEmptyString);
    expect(pEmpty.fullName.middleName).toBeNull();
  });

  it("throws ValidationError when lastName or firstName are empty after trimming", () => {
    const badArgs: BuildPatientArgs = {
      lastName: "   ",
      firstName: "",
      middleName: null,
      dobRaw: "19700101",
      primaryCondition: "Cough",
    };

    expect(() => new Patient(badArgs)).toThrow(ValidationError);
  });

  it("throws ValidationError for malformed dobRaw", () => {
    const wrongFormat: BuildPatientArgs = {
      lastName: "Lee",
      firstName: "Bruce",
      middleName: null,
      dobRaw: "1980-01-02", // wrong format
      primaryCondition: "Injury",
    };
    expect(() => new Patient(wrongFormat)).toThrow(ValidationError);
  });

  it("throws ValidationError for impossible date values", () => {
    const impossibleMonth: BuildPatientArgs = {
      lastName: "Invalid",
      firstName: "Date",
      middleName: null,
      dobRaw: "19801301", // month 13
      primaryCondition: "Unknown",
    };
    expect(() => new Patient(impossibleMonth)).toThrow(ValidationError);

    const nonLeapFeb29: BuildPatientArgs = {
      lastName: "Invalid",
      firstName: "Leap",
      middleName: null,
      dobRaw: "20230229", // 2023 not leap
      primaryCondition: "Unknown",
    };
    expect(() => new Patient(nonLeapFeb29)).toThrow(ValidationError);
  });

  it("throws ValidationError when primaryCondition is empty or whitespace", () => {
    const bad: BuildPatientArgs = {
      lastName: "Miller",
      firstName: "Tom",
      middleName: null,
      dobRaw: "20000101",
      primaryCondition: "   ",
    };
    expect(() => new Patient(bad)).toThrow(ValidationError);
  });

  it("accumulates multiple validation issues when many fields are invalid", () => {
    const bad: BuildPatientArgs = {
      lastName: "   ",
      firstName: " ",
      middleName: null,
      dobRaw: "bad-date",
      primaryCondition: " ",
    };

    expect(() => new Patient(bad)).toThrow(ValidationError);
  });
});
