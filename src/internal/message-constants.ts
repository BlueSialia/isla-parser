// Segment type constants

export const SEGMENT_MSG = "MSG" as const;
export const SEGMENT_EVT = "EVT" as const;
export const SEGMENT_PRS = "PRS" as const;
export const SEGMENT_DET = "DET" as const;

export const REQUIRED_SEGMENTS = [SEGMENT_PRS, SEGMENT_DET] as const;
export type RequiredSegment = (typeof REQUIRED_SEGMENTS)[number];

// Field constants
export const FIELD_SEPARATOR = "|" as const;
export const COMPONENT_SEPARATOR = "^" as const;

export const PRS_FIELDS = {
  NAME: 3,
  DOB: 7,
} as const;

export const DET_FIELDS = {
  DIAGNOSIS: 3,
} as const;

export const YYYYMMDD_RE = /^\d{8}$/;
