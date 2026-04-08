export interface ValidationIssue {
  field?: string;
  message: string;
  code?: string;
  meta?: Record<string, unknown>;
}

export class ValidationError extends Error {
  public readonly issues: ValidationIssue[];

  constructor(message = "Validation failed", issues: ValidationIssue[] = []) {
    super(message);
    this.name = "ValidationError";
    this.issues = issues;

    if (Error.captureStackTrace) {
      // No constructor in stack
      Error.captureStackTrace(this, this.constructor);
    }
  }

  addIssue(issue: ValidationIssue): void {
    this.issues.push(issue);
  }

  isEmpty(): boolean {
    return this.issues.length === 0;
  }

  toJSON(): { name: string; message: string; issues: ValidationIssue[] } {
    return {
      name: this.name,
      message: this.message,
      issues: this.issues,
    };
  }

  static isValidationError(value: unknown): value is ValidationError {
    return (
      value instanceof ValidationError ||
      (typeof value === "object" &&
        value !== null &&
        "name" in value &&
        (value as { name: unknown }).name === "ValidationError")
    );
  }
}
