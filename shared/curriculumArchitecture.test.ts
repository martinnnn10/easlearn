import { describe, expect, it } from "vitest";
import {
  CURRICULUM_TRACKS,
  MODULE_CURRICULUM_TRACK,
  getCurriculumTrackForModule,
  getPrerequisiteTrackNames,
} from "./curriculumArchitecture";

describe("curriculumArchitecture", () => {
  it("defines exactly 6 tracks in prerequisite order", () => {
    expect(CURRICULUM_TRACKS).toHaveLength(6);
    expect(CURRICULUM_TRACKS.map((t) => t.trackNumber)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("Track 1 has no prerequisites", () => {
    expect(CURRICULUM_TRACKS[0].prerequisites).toEqual([]);
    expect(getPrerequisiteTrackNames(CURRICULUM_TRACKS[0])).toBe("None — start here");
  });

  it("Track 2 requires Track 1", () => {
    expect(CURRICULUM_TRACKS[1].prerequisites).toEqual(["electrical-fundamentals"]);
  });

  it("Track 3 requires Track 2", () => {
    expect(CURRICULUM_TRACKS[2].prerequisites).toEqual(["digital-control-fundamentals"]);
  });

  it("Track 4 requires Track 1 and Track 3", () => {
    expect(CURRICULUM_TRACKS[3].prerequisites).toEqual([
      "electrical-fundamentals",
      "plc-controls",
    ]);
  });

  it("Track 5 requires Track 3", () => {
    expect(CURRICULUM_TRACKS[4].prerequisites).toEqual(["plc-controls"]);
  });

  it("Track 6 requires Track 1", () => {
    expect(CURRICULUM_TRACKS[5].prerequisites).toEqual(["electrical-fundamentals"]);
  });

  it("maps ILU conversion modules to expected tracks", () => {
    expect(getCurriculumTrackForModule("plc-fundamentals")?.trackNumber).toBe(3);
    expect(getCurriculumTrackForModule("powerflex-vfd")?.trackNumber).toBe(4);
    expect(getCurriculumTrackForModule("sensors-instrumentation")?.trackNumber).toBe(5);
    expect(getCurriculumTrackForModule("safety-systems")?.trackNumber).toBe(2);
    expect(getCurriculumTrackForModule("print-reading")?.trackNumber).toBe(1);
  });

  it("assigns each module slug to at most one track", () => {
    const slugs = Object.keys(MODULE_CURRICULUM_TRACK);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("includes exit competency for every track", () => {
    for (const track of CURRICULUM_TRACKS) {
      expect(track.exitCompetency.length).toBeGreaterThan(20);
      expect(track.moduleSlugs.length).toBeGreaterThan(0);
    }
  });
});
