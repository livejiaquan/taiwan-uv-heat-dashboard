import { describe, expect, it } from "vitest";
import { buildDashboardData } from "./cwa";
import { heatRiskLevel, overallRiskLevel, uvRiskLevel } from "./risk";

describe("risk levels", () => {
  it("does not classify missing UV data as low risk", () => {
    expect(uvRiskLevel(undefined).tone).toBe("unknown");
  });

  it("does not classify missing heat data as low risk", () => {
    expect(heatRiskLevel(undefined, undefined).tone).toBe("unknown");
  });

  it("keeps overall risk unknown only when both dimensions are missing", () => {
    const missing = uvRiskLevel(undefined);
    const highHeat = heatRiskLevel(35, undefined);

    expect(overallRiskLevel(missing, missing).tone).toBe("unknown");
    expect(overallRiskLevel(missing, highHeat).tone).toBe("very-high");
  });
});

describe("dashboard data quality", () => {
  it("marks counties with no usable live payload as missing instead of safe", () => {
    const dashboard = buildDashboardData("live", [], {});

    expect(dashboard.stats.missingDataCount).toBe(dashboard.stats.totalCounties);
    expect(dashboard.stats.safest).toBeUndefined();
    expect(dashboard.counties.every((county) => county.overallLevel.tone === "unknown")).toBe(
      true,
    );
  });
});
