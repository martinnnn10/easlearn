import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

describe("simulatorSession router", () => {
  it("should define save procedure", () => {
    expect(appRouter._def.procedures).toHaveProperty("simulatorSession.save");
  });

  it("should define get procedure", () => {
    expect(appRouter._def.procedures).toHaveProperty("simulatorSession.get");
  });

  it("should define clear procedure", () => {
    expect(appRouter._def.procedures).toHaveProperty("simulatorSession.clear");
  });
});

describe("errorLogging router", () => {
  it("should define logError procedure", () => {
    expect(appRouter._def.procedures).toHaveProperty("errorLogging.logClientError");
  });

  it("should define getRecentErrors procedure", () => {
    expect(appRouter._def.procedures).toHaveProperty("errorLogging.getRecentErrors");
  });
});
