import type { EvidenceItem, StageDefinition, StageId, Suspect } from "./case-types";

export const CASE_TITLE = "Zero Meridian";
export const CASE_CODE = "NM–17 / 88.4";
export const RESET_PHRASE = "ZERO MERIDIAN";

export const STAGES: StageDefinition[] = [
  {
    id: "protocol", index: 0, number: "00", title: "The Watch Protocol",
    subtitle: "Rebuild the night they rewrote", site: "hub", siteLabel: "Briefing", href: "/#protocol",
    duration: "15–25 min", prerequisites: [],
    brief: "Six logs survived the outage, but their pages were shuffled. The timestamps contradict the autosave order. Rebuild the causal chain and find the moment the loop was breached.",
    objective: "Order six events and enter the two-digit intrusion code.",
  },
  {
    id: "catalogue", index: 1, number: "01", title: "The Dead Catalogue",
    subtitle: "Cards that know how to lie", site: "archive", siteLabel: "Archive 17", href: "/archive#catalogue",
    duration: "35–60 min", prerequisites: ["protocol"],
    brief: "Fund M-17 holds twelve cards. Some were swapped before digitization. The archival standard leaves them a numeric trace: the control remainder never forgives even a careful forgery.",
    objective: "Find every forged card and read the six-letter callsign.",
  },
  {
    id: "cipher", index: 2, number: "02", title: "Palimpsest",
    subtitle: "A document beneath the document", site: "archive", siteLabel: "Archive 17", href: "/archive#cipher",
    duration: "30–50 min", prerequisites: ["catalogue"],
    brief: "An engineering telegram is enciphered with a columnar transposition. The callsign from the catalogue sets the column order. Without it the text stays a plausible jumble of letters — and nothing more.",
    objective: "Decrypt the carrier and phase parameters of the relay.",
  },
  {
    id: "signal", index: 3, number: "03", title: "A Voice on 88.4",
    subtitle: "Tune what should not exist", site: "relay", siteLabel: "Relay 88.4", href: "/relay#signal",
    duration: "25–45 min", prerequisites: ["cipher"],
    brief: "The signal falls apart from a wrong frequency and phase. Once tuned exactly, the noise becomes four groups of Morse code. The audio path uses a lowered 620 Hz tone — an honest copy of the envelope, not a recording.",
    objective: "Synchronize the receiver, hear the message, and name the keyword.",
  },
  {
    id: "atlas", index: 4, number: "04", title: "The Lunar Atlas",
    subtitle: "Five observations among twelve", site: "atlas", siteLabel: "Atlas", href: "/atlas#atlas",
    duration: "45–70 min", prerequisites: ["signal"],
    brief: "The astronomy log mixes records from different instruments and channels. The relay message explains which rows belong to one series. Each correct azimuth is not a coordinate but a letter index on a fifteen-degree disk.",
    objective: "Select the series, convert azimuths, and find the route's entry point.",
  },
  {
    id: "network", index: 5, number: "05", title: "Fifteen Legs",
    subtitle: "A Hamiltonian path through a dead network", site: "atlas", siteLabel: "Router", href: "/atlas#network",
    duration: "60–100 min", prerequisites: ["atlas"],
    brief: "You must cross the whole network in exactly fifteen legs without revisiting a station. The sensors from earlier fragments must fire in the order they were earned. One line cannot survive more than two legs in a row.",
    objective: "Build a route from RIGEL to ZERO, firing five sensors and four gateways.",
  },
  {
    id: "core", index: 6, number: "06", title: "The Zero Meridian Core",
    subtitle: "Numbers end. Judgment begins.", site: "core", siteLabel: "Core", href: "/core",
    duration: "30–50 min", prerequisites: ["network"],
    brief: "Six fragments form an integrity register. But opening the case is not enough: the core demands the author of the route and their purpose. Every proof you need has already crossed your path on a different node.",
    objective: "Compute the two-register code and deliver a reasoned verdict.",
  },
];

export const FRAGMENTS: Record<StageId, string> = {
  protocol: "17", catalogue: "06", cipher: "88", signal: "04", atlas: "15", network: "31", core: "965",
};

export const EVIDENCE: EvidenceItem[] = [
  { id: "incident-reconstruction", stageId: "protocol", title: "Axis of the intrusion", source: "Master log / 00:04–00:41", tag: "Timeline", body: "Power dropped at 00:04. The incoming call was answered at 00:08, the backup loop activated at 00:17. Room 17 was opened at 00:26, the last file written at 00:35, the transmission began at 00:41. The intrusion code is 17." },
  { id: "night-access", stageId: "protocol", title: "Two different accesses", source: "Security service / appendix B", tag: "Access", body: "Opening Room 17 was physical, while starting the transmitter was a certified digital action. A remote astronomy terminal could not open a mechanical lock." },
  { id: "catalogue-forgeries", stageId: "catalogue", title: "Six forgeries", source: "Fund M-17 / control sheet", tag: "Catalogue", body: "Exactly six cards failed the remainder modulo 17. Their titles in year order spell the callsign FALCON. Each carries a blue engineering stamp, form R-88 — not the archive's violet stamp." },
  { id: "archive-handwriting", stageId: "catalogue", title: "Draft of the transposition", source: "Box 12 / questionnaire margin", tag: "Handwriting", body: "A six-column table survives in the margin. The note 'for the relay shift' rules out a cipher appearing in the archive fund by accident." },
  { id: "telegram", stageId: "cipher", title: "Telegram R-88", source: "Decrypted form / 7 × 6", tag: "Cipher", body: "CARRIER EIGHTY EIGHT AND FOUR. PHASE TWO SEVEN ZERO. That is 88.4 and 270°. Form R-88 is issued only to the relay shift; manual phase calibration requires a class-two clearance." },
  { id: "signal-message", stageId: "signal", title: "Message after synchronization", source: "Relay / 620 Hz envelope", tag: "Transmission", body: "MOON. Channel 04. Optical lunar observations only: cloud cover no higher than 20%, altitude above the horizon positive. Divide azimuth by 15; English alphabet, A = 0." },
  { id: "operator-license", stageId: "signal", title: "Calibration certificate", source: "Relay / clearance registry", tag: "Clearance", body: "A manual 270° phase shift could be performed only by an operator with class-two clearance. On the night shift that clearance belonged to Serafima Ro. The archivist and the guard held emergency access only." },
  { id: "lunar-series", stageId: "atlas", title: "The RIGEL series", source: "Optical log / channel 04", tag: "Observations", body: "Five clean records give indices 17, 8, 6, 4, 11 — RIGEL. The conversion disk has a 15° step. All five rows were added to the log after astronomer Lev Astrov was dismissed." },
  { id: "route-proof", stageId: "network", title: "The keeper's route", source: "Router / register 99", tag: "Network", body: "The sensor sum 17 + 6 + 88 + 4 + 15 equals 130; modulo 99 gives 31. The route led not to a stash but to an immutable backup copy. It cannot be opened without an independent witness." },
  { id: "keeper-note", stageId: "network", title: "An unsigned note", source: "Station ZERO / local buffer", tag: "Motive", body: "'I did not need a burglar, I needed a witness. I swapped the catalogue so the corporation would not find the originals, and I left the route for whoever could verify every link. Not a sale. Not revenge. Preservation.'" },
];

export const SUSPECTS: Suspect[] = [
  { id: "weiss", name: "Mara Weiss", role: "Archivist of fund M-17", shift: "18:00–23:50 · left before the outage", access: "Physical key to Room 17; no phase clearance", statement: "'I saw the blue stamps, but that is not an archival form. By 00:04 I was already past the checkpoint.'", detail: "Knows the catalogue modulus but is not certified for manual transmitter calibration." },
  { id: "ro", name: "Serafima Ro", role: "Relay-shift engineer", shift: "22:00–06:00 · inside the perimeter", access: "Guest archive key; phase, clearance II; R-88 forms", statement: "'The transmitter was unpowered. If it spoke, someone assembled a backup path.'", detail: "The only person on the night shift combining physical access, engineering forms, and the right to shift phase." },
  { id: "astrov", name: "Lev Astrov", role: "Astronomer, external contractor", shift: "Dismissed 11 days before the incident", access: "Remote atlas disabled; no mechanical key", statement: "'My old ephemerides are still in the system. That does not mean I added the rows.'", detail: "Understands the lunar disk but could not physically open Room 17 at the recorded time." },
  { id: "noll", name: "Thomas Noll", role: "Watch operator", shift: "00:00–08:00 · guard post", access: "Mechanical keys; no catalogue or phase clearance", statement: "'I took the call at 00:08. Nine minutes later the backup loop started on its own.'", detail: "His log confirms the timeline but does not explain the elaborate swap and calibration." },
];

export function getStage(id: string): StageDefinition | undefined {
  return STAGES.find((stage) => stage.id === id);
}

export function evidenceForSolved(solved: StageId[]): EvidenceItem[] {
  return EVIDENCE.filter((item) => solved.includes(item.stageId));
}
