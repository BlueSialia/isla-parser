export interface ParsingErrorOptions {
  code?: string;
  segment?: string;
  fieldIndex?: number;
  componentIndex?: number;
  original?: string;
}

/**
 * Represents an error encountered while parsing a message or a segment.
 */
export class ParsingError extends Error {
  public readonly code?: string;
  public readonly segment?: string;
  public readonly fieldIndex?: number;
  public readonly componentIndex?: number;
  public readonly original?: string;

  constructor(message: string, options: ParsingErrorOptions = {}) {
    super(message);
    this.name = "ParsingError";

    Object.assign(this, options);

    if (Error.captureStackTrace) {
      // No constructor in stack
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      segment: this.segment,
      fieldIndex: this.fieldIndex,
      componentIndex: this.componentIndex,
      original: this.original,
      stack: this.stack,
    };
  }

  static fromUnknown(err: unknown): ParsingError {
    if (err instanceof ParsingError) return err;
    if (err instanceof Error) return new ParsingError(err.message);
    return new ParsingError(String(err));
  }
}

export const isParsingError = (value: unknown): value is ParsingError =>
  value instanceof ParsingError ||
  (typeof value === "object" &&
    value !== null &&
    "name" in value &&
    (value as { name: unknown }).name === "ParsingError");
