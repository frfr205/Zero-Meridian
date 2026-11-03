export const PROTOCOL_EVENTS = [
  { id: "relay", time: "00:41", source: "Transmitter", text: "The relay began broadcasting six minutes after the last catalogue file was written." },
  { id: "backup", time: "00:17", source: "Watchman", text: "The backup loop woke nine minutes after the operator picked up the phone." },
  { id: "storage", time: "00:35", source: "Storage", text: "Last catalogue file written. Its checksum no longer matches the previous revision." },
  { id: "power", time: "00:04", source: "Power room", text: "External power lost. The backup loop is not active yet; the phone line runs on battery." },
  { id: "archive", time: "00:26", source: "Seal sensor", text: "Room 17 was opened nine minutes after the backup loop restarted." },
  { id: "call", time: "00:08", source: "Exchange", text: "Incoming call from an unregistered number. The operator answered and stayed on the line." },
] as const;

export interface CatalogRecord {
  id: string; title: string; year: number; box: number; pages: number; check: number; shelf: string; stamp: string; note: string;
}

export const CATALOG_RECORDS: CatalogRecord[] = [
  { id: "c07", title: "Inventory of optical plates", year: 1977, box: 8, pages: 24, check: 14, shelf: "C-04", stamp: "violet", note: "Pagination matches the finding aid." },
  { id: "c02", title: "Astral duty questionnaire", year: 1971, box: 9, pages: 41, check: 4, shelf: "A-09", stamp: "blue R-88", note: "Engineering paper stock, glued over an older card." },
  { id: "c11", title: "Upper-tier weather report", year: 1981, box: 1, pages: 90, check: 14, shelf: "D-01", stamp: "violet", note: "Carries an independent cross-check mark." },
  { id: "c04", title: "Comet altitude noise", year: 1979, box: 12, pages: 33, check: 12, shelf: "B-12", stamp: "blue R-88", note: "A six-column grid is sketched in the margin." },
  { id: "c01", title: "Flood-tide cartography", year: 1968, box: 4, pages: 28, check: 9, shelf: "A-04", stamp: "blue R-88", note: "The year was corrected without an archival note." },
  { id: "c09", title: "Night-duty journal", year: 1972, box: 6, pages: 72, check: 3, shelf: "C-06", stamp: "violet", note: "Three shifts signed; no signs of a paste-in." },
  { id: "c06", title: "North ice-drift log", year: 1988, box: 5, pages: 46, check: 14, shelf: "E-05", stamp: "blue R-88", note: "The latest-by-year card bearing an engineering stamp." },
  { id: "c12", title: "Emergency lighting schematic", year: 1990, box: 10, pages: 12, check: 5, shelf: "E-10", stamp: "violet", note: "Created after the incident; remainder is valid." },
  { id: "c03", title: "Lunar eclipse schedule", year: 1974, box: 2, pages: 64, check: 16, shelf: "B-02", stamp: "blue R-88", note: "The volume is missing, but the control digit survives." },
  { id: "c08", title: "Lens calibration diary", year: 1969, box: 11, pages: 18, check: 9, shelf: "A-11", stamp: "violet", note: "Record closed before the incident." },
  { id: "c05", title: "Outer-service charter", year: 1983, box: 7, pages: 52, check: 1, shelf: "D-07", stamp: "blue R-88", note: "Box number matches the engineering registry, not the archive." },
  { id: "c10", title: "Ionosphere service bulletin", year: 1965, box: 3, pages: 20, check: 6, shelf: "A-03", stamp: "violet", note: "The earliest card in the fund; undamaged." },
];

export function expectedCatalogCheck(record: Pick<CatalogRecord, "year" | "box" | "pages">): number {
  return (record.year + record.box * 7 + record.pages * 3) % 17;
}

// Plaintext (7 rows × 6 columns): CARRIER EIGHTY EIGHT AND FOUR PHASE TWO SEVEN ZERO
export const CIPHER_TEXT = "AEENPWNRGGFASECRYARTERIIDHOZETTUEVOIHHOSER";
export const CIPHER_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const MORSE_MAP: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..",
};
export const SIGNAL_MORSE = "-- / --- / --- / -.";

export interface Observation {
  id: string; time: string; object: string; instrument: "optics" | "radio"; channel: number; clouds: number; altitude: number; azimuth: number; operator: string; note: string;
}

export const OBSERVATIONS: Observation[] = [
  { id: "o08", time: "02:50", object: "Moon", instrument: "optics", channel: 4, clouds: 5, altitude: 18, azimuth: 60, operator: "R-88", note: "Terminator steady." },
  { id: "o02", time: "00:58", object: "Moon", instrument: "optics", channel: 4, clouds: 45, altitude: 22, azimuth: 45, operator: "A-12", note: "Dense cloud, contour blurred." },
  { id: "o11", time: "03:25", object: "Moon", instrument: "optics", channel: 4, clouds: 10, altitude: 9, azimuth: 165, operator: "R-88", note: "Last clean frame of the series." },
  { id: "o04", time: "01:22", object: "Moon", instrument: "radio", channel: 4, clouds: 5, altitude: 30, azimuth: 60, operator: "R-02", note: "Radiometer; no optical frame created." },
  { id: "o07", time: "02:15", object: "Moon", instrument: "optics", channel: 4, clouds: 0, altitude: 25, azimuth: 90, operator: "R-88", note: "Zero cloud, exposure 1/30." },
  { id: "o12", time: "03:41", object: "Moon", instrument: "optics", channel: 4, clouds: 0, altitude: 0, azimuth: 300, operator: "A-12", note: "Object on the horizon line; altitude not positive." },
  { id: "o01", time: "01:10", object: "Moon", instrument: "optics", channel: 4, clouds: 10, altitude: 31, azimuth: 255, operator: "R-88", note: "Start of the continuous series." },
  { id: "o05", time: "01:37", object: "Moon", instrument: "optics", channel: 7, clouds: 10, altitude: 40, azimuth: 90, operator: "A-07", note: "Backup channel, different calibration." },
  { id: "o09", time: "03:02", object: "Mars", instrument: "optics", channel: 4, clouds: 5, altitude: 30, azimuth: 150, operator: "A-04", note: "A planet, not a lunar observation." },
  { id: "o03", time: "01:40", object: "Moon", instrument: "optics", channel: 4, clouds: 15, altitude: 28, azimuth: 120, operator: "R-88", note: "Second exposure, light cirrus haze." },
  { id: "o10", time: "03:12", object: "Moon", instrument: "optics", channel: 4, clouds: 21, altitude: 15, azimuth: 225, operator: "A-12", note: "Cloud one percent above the threshold." },
  { id: "o06", time: "01:53", object: "Moon", instrument: "optics", channel: 4, clouds: 8, altitude: -4, azimuth: 135, operator: "A-12", note: "Reflection in water; the object itself is below the horizon." },
];

export function isCleanLunarObservation(item: Observation): boolean {
  return item.object === "Moon" && item.instrument === "optics" && item.channel === 4 && item.clouds <= 20 && item.altitude > 0;
}

export type LineId = "cyan" | "amber" | "green";
export interface NetworkNode { id: string; name: string; x: number; y: number; sensor?: number; gateway?: boolean; }
export interface NetworkEdge { a: string; b: string; line: LineId; }

export const NETWORK_NODES: NetworkNode[] = [
  { id: "zen", name: "RIGEL", x: 6, y: 48 }, { id: "sever", name: "NORTH", x: 17, y: 25 },
  { id: "port", name: "PORT", x: 30, y: 10, sensor: 17 }, { id: "ten", name: "SHADE", x: 43, y: 24 },
  { id: "arhiv", name: "ARCHIVE", x: 55, y: 10, sensor: 6 }, { id: "kanal", name: "CHANNEL", x: 65, y: 27 },
  { id: "mayak", name: "BEACON", x: 79, y: 12, sensor: 88 }, { id: "pepel", name: "ASH", x: 90, y: 30 },
  { id: "linza", name: "LENS", x: 81, y: 51, sensor: 4 }, { id: "orbita", name: "ORBIT", x: 65, y: 65 },
  { id: "vektor", name: "VECTOR", x: 80, y: 84, sensor: 15 }, { id: "nul", name: "ZERO", x: 95, y: 69 },
  { id: "bashnya", name: "TOWER", x: 25, y: 65, gateway: true }, { id: "prichal", name: "PIER", x: 40, y: 84, gateway: true },
  { id: "kolodets", name: "WELL", x: 53, y: 46, gateway: true }, { id: "steklo", name: "GLASS", x: 39, y: 47, gateway: true },
];

export const NETWORK_EDGES: NetworkEdge[] = [
  { a: "zen", b: "sever", line: "cyan" }, { a: "sever", b: "port", line: "cyan" }, { a: "port", b: "bashnya", line: "green" },
  { a: "bashnya", b: "ten", line: "green" }, { a: "ten", b: "arhiv", line: "amber" }, { a: "arhiv", b: "prichal", line: "cyan" },
  { a: "prichal", b: "kanal", line: "cyan" }, { a: "kanal", b: "mayak", line: "green" }, { a: "mayak", b: "kolodets", line: "amber" },
  { a: "kolodets", b: "pepel", line: "amber" }, { a: "pepel", b: "linza", line: "green" }, { a: "linza", b: "steklo", line: "cyan" },
  { a: "steklo", b: "orbita", line: "cyan" }, { a: "orbita", b: "vektor", line: "amber" }, { a: "vektor", b: "nul", line: "green" },
  { a: "port", b: "ten", line: "amber" }, { a: "arhiv", b: "kanal", line: "cyan" }, { a: "mayak", b: "pepel", line: "green" },
  { a: "linza", b: "orbita", line: "amber" }, { a: "zen", b: "steklo", line: "amber" }, { a: "sever", b: "kolodets", line: "green" },
  { a: "port", b: "pepel", line: "cyan" }, { a: "ten", b: "steklo", line: "cyan" }, { a: "arhiv", b: "kolodets", line: "amber" },
  { a: "kanal", b: "steklo", line: "green" }, { a: "mayak", b: "orbita", line: "cyan" }, { a: "pepel", b: "prichal", line: "amber" },
  { a: "linza", b: "nul", line: "amber" }, { a: "bashnya", b: "steklo", line: "amber" }, { a: "prichal", b: "kolodets", line: "cyan" },
];

export function findNetworkEdge(a: string, b: string): NetworkEdge | undefined {
  return NETWORK_EDGES.find((edge) => (edge.a === a && edge.b === b) || (edge.a === b && edge.b === a));
}

export const MOTIVES = [
  { id: "sell", label: "Sell the originals and erase the digital trail" },
  { id: "revenge", label: "Halt the research and take revenge on management" },
  { id: "preserve", label: "Preserve the materials and hand them to an independent witness" },
] as const;
