import { ParsingError } from "./errors/parsing-error";
import extractPatient from "./extractor";
import { Patient } from "./models/patient";
import parseMessage from "./parser";

/**
 * Parse a message, extract patient fields, and construct a domain Patient.
 * Returns the serializable representation.
 */
export function processMessage(message: string): ReturnType<Patient["toJSON"]> {
  const segments = parseMessage(message);
  if (!Array.isArray(segments) || segments.length === 0) {
    throw new ParsingError("no segments parsed from message");
  }

  const extracted = extractPatient(segments);

  const patient = new Patient(extracted);
  return patient.toJSON();
}

/**
 * Parse a message, extract patient fields, and construct a domain Patient.
 * Returns the JSON string representation.
 */
export function processMessageToJsonString(
  message: string,
  space: number = 2,
): string {
  const patientJson = processMessage(message);
  return JSON.stringify(patientJson, null, space);
}

export default processMessage;
