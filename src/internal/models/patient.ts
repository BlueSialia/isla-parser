export interface FullName {
  lastName: string;
  firstName: string;
  middleName: string | null;
}

export type BuildPatientArgs = {
  lastName: string;
  firstName: string;
  middleName: string | null;
  dobRaw: string;
  primaryCondition: string;
};

import {
  ValidationError,
  type ValidationIssue,
} from "../errors/validation-error";
import { YYYYMMDD_RE } from "../message-constants";

/** Domain model representing a validated patient with normalized fields and JSON serialization. */
export class Patient {
  public readonly fullName: FullName;
  public readonly dateOfBirth: Date;
  public readonly primaryCondition: string;

  constructor(args: BuildPatientArgs) {
    const issues: ValidationIssue[] = [];

    // Normalize and trim name parts
    const lastName = args.lastName.trim();
    const firstName = args.firstName.trim();

    let middleName: string | null = null;
    if (args.middleName === null) {
      middleName = null;
    } else {
      const m = args.middleName.trim();
      middleName = m.length > 0 ? m : null;
    }

    if (lastName.length === 0) {
      issues.push({
        field: "fullName.lastName",
        message: "lastName is required and must be a non-empty string",
      });
    }
    if (firstName.length === 0) {
      issues.push({
        field: "fullName.firstName",
        message: "firstName is required and must be a non-empty string",
      });
    }

    // Normalize DOB
    let dob: Date | null = null;
    if (YYYYMMDD_RE.test(args.dobRaw)) {
      const y: number = Number(args.dobRaw.substring(0, 4)),
        m: number = Number(args.dobRaw.substring(4, 6)) - 1, // Months are zero-indexed
        d: number = Number(args.dobRaw.substring(6, 8));

      dob = new Date(Date.UTC(y, m, d));

      if (
        !(
          dob.getUTCFullYear() === y &&
          dob.getUTCMonth() === m &&
          dob.getUTCDate() === d
        )
      ) {
        issues.push({
          field: "dateOfBirth",
          message: "dateOfBirth must be a valid date in YYYYMMDD format",
        });
      }
    } else {
      issues.push({
        field: "dateOfBirth",
        message:
          "dateOfBirth is required and must be a string in YYYYMMDD format",
      });
    }

    // Normalize primary condition
    const primaryCondition = args.primaryCondition.trim();
    if (primaryCondition.length === 0) {
      issues.push({
        field: "primaryCondition",
        message: "primaryCondition is required and must be a non-empty string",
      });
    }

    if (issues.length > 0) {
      throw new ValidationError("Validation failed", issues);
    }

    this.fullName = {
      lastName,
      firstName,
      middleName,
    };
    this.dateOfBirth = dob as Date;
    this.primaryCondition = primaryCondition;
  }

  private static formatDateToYYYY_MM_DD(d: Date): string {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  toJSON(): {
    fullName: FullName;
    dateOfBirth: string;
    primaryCondition: string;
  } {
    return {
      fullName: this.fullName,
      dateOfBirth: Patient.formatDateToYYYY_MM_DD(this.dateOfBirth),
      primaryCondition: this.primaryCondition,
    };
  }
}
