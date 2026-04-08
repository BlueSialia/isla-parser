import { COMPONENT_SEPARATOR, FIELD_SEPARATOR } from "./message-constants";

export type ParsedComponent = string;
export type ParsedField = ParsedComponent[];
export interface ParsedSegment {
  name: string;
  fields: ParsedField[];
}

export function parseSegment(line: string): ParsedSegment {
  const firstSep = line.indexOf(FIELD_SEPARATOR);
  const name = firstSep === -1 ? line : line.substring(0, firstSep);
  const tag = name.trim().toUpperCase();

  const rest =
    firstSep === -1 ? "" : line.substring(firstSep + FIELD_SEPARATOR.length);
  const rawFields = rest === "" ? [] : rest.split(FIELD_SEPARATOR);

  const fields: ParsedField[] = rawFields.map((f) => {
    // empty fields as [''] so positions are stable
    if (f === "") return [""];
    return f.split(COMPONENT_SEPARATOR);
  });

  return {
    name: tag,
    fields,
  };
}

export function parseMessage(message: string): ParsedSegment[] {
  const lines = message
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const segments: ParsedSegment[] = lines.map((l) => parseSegment(l));

  return segments;
}

export default parseMessage;
