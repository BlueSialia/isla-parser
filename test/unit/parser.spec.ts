import { describe, expect, it } from "vitest";

import { parseMessage, parseSegment } from "../../src/internal/parser";

describe("parser.parseSegment", () => {
  it("returns the whole line as name and no fields when there is no field separator", () => {
    const seg = parseSegment("NOSPLIT");
    expect(seg.name).toBe("NOSPLIT");
    expect(seg.fields).toEqual([]);
  });

  it("parses fields and components correctly", () => {
    const seg = parseSegment("ABC|one^two|three");
    expect(seg.name).toBe("ABC");
    expect(seg.fields.length).toBe(2);
    expect(seg.fields[0]).toEqual(["one", "two"]);
    expect(seg.fields[1]).toEqual(["three"]);
  });

  it("preserves empty fields as single-element [''] so positions remain stable", () => {
    const seg = parseSegment("ABC|a||");
    expect(seg.name).toBe("ABC");
    expect(seg.fields.length).toBe(3);
    expect(seg.fields[0]).toEqual(["a"]);
    expect(seg.fields[1]).toEqual([""]);
    expect(seg.fields[2]).toEqual([""]);
  });

  it("splits components and preserves empty components", () => {
    const seg = parseSegment("X|a^^c|^");
    expect(seg.name).toBe("X");
    expect(seg.fields[0]).toEqual(["a", "", "c"]);
    expect(seg.fields[1]).toEqual(["", ""]);
  });

  it("trims segment name and uppercases the tag", () => {
    const seg = parseSegment(" prs |foo^bar");
    expect(seg.name).toBe("PRS");
    expect(seg.fields[0]).toEqual(["foo", "bar"]);
  });
});

describe("parser.parseMessage", () => {
  it("splits a multi-line message into segments, trimming lines and ignoring empty lines", () => {
    const raw = [
      "MSG|^~\\&|SenderSystem|Location|ReceiverSystem|Location|20230502112233||DATA^TYPE|123456|P|2.5",
      "EVT|TYPE|20230502112233",
      "",
      "PRS|1|9876543210^^^Location^ID||Smith^John^A|||M|19800101|",
      "DET|1|I|^^MainDepartment^101^Room 1|Common Cold",
      "",
    ].join("\r\n"); // include CRLF to test windows-style line endings

    const segments = parseMessage(raw);

    expect(segments.map((s) => s.name)).toEqual(["MSG", "EVT", "PRS", "DET"]);

    const msgSeg = segments[0];
    expect(msgSeg.name).toBe("MSG");
    expect(msgSeg.fields.length).toBeGreaterThan(0);
    const dataField = msgSeg.fields[7];
    expect(Array.isArray(dataField)).toBe(true);
    expect(dataField.length).toBe(2);

    const prs = segments[2];
    const nameField = prs.fields[3];
    expect(nameField).toBeDefined();
    expect(nameField).toEqual(["Smith", "John", "A"]);

    const det = segments[3];
    const diagnosisField = det.fields[3];
    expect(diagnosisField).toBeDefined();
    expect(diagnosisField).toEqual(["Common Cold"]);
  });

  it("handles messages with extra whitespace lines and surrounding spaces on each line", () => {
    const raw = "  MSG|a^b|c  \n\n  DET|x|y^z  \n";
    const segments = parseMessage(raw);

    expect(segments.length).toBe(2);
    expect(segments[0].name).toBe("MSG");
    expect(segments[1].name).toBe("DET");
    expect(segments[0].fields[0]).toEqual(["a", "b"]);
    expect(segments[0].fields[1]).toEqual(["c"]);
  });
});
