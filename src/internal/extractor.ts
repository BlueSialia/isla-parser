import { ParsingError } from "./errors/parsing-error";
import {
  COMPONENT_SEPARATOR,
  DET_FIELDS,
  PRS_FIELDS,
  REQUIRED_SEGMENTS,
  SEGMENT_DET,
  SEGMENT_PRS,
} from "./message-constants";
import type { BuildPatientArgs } from "./models/patient";
import type { ParsedSegment } from "./parser";

export function extractPatient(segments: ParsedSegment[]): BuildPatientArgs {
  for (const req of REQUIRED_SEGMENTS) {
    const count = segments.filter((s) => s.name === req).length;
    if (count === 0) {
      throw new ParsingError(`required segment not found: ${req}`, {
        code: "E_MISSING_SEGMENT",
        segment: req,
      });
    }
    if (count > 1) {
      throw new ParsingError(`multiple ${req} segments found`, {
        code: "E_MULTIPLE_SEGMENTS",
        segment: req,
      });
    }
  }

  const prs = segments.find(
    (s) => (s.name || "").toUpperCase() === SEGMENT_PRS,
  );
  const det = segments.find(
    (s) => (s.name || "").toUpperCase() === SEGMENT_DET,
  );

  const nameFieldComps = prs?.fields[PRS_FIELDS.NAME] ?? [];
  const dobFieldComps = prs?.fields[PRS_FIELDS.DOB] ?? [];
  const conditionFieldComps = det?.fields[DET_FIELDS.DIAGNOSIS] ?? [];

  const lastName = nameFieldComps[0] ?? "";
  const firstName = nameFieldComps[1] ?? "";
  const middleName = nameFieldComps[2] ?? "";

  const dob =
    dobFieldComps.length > 0 ? dobFieldComps.join(COMPONENT_SEPARATOR) : null;

  const primaryConditionRaw =
    conditionFieldComps.length > 0
      ? conditionFieldComps.join(COMPONENT_SEPARATOR).trim()
      : null;

  const result: BuildPatientArgs = {
    lastName: lastName,
    firstName: firstName,
    middleName: middleName === "" ? null : middleName,
    dobRaw: dob ?? "",
    primaryCondition: primaryConditionRaw ?? "",
  };

  return result;
}

export default extractPatient;
