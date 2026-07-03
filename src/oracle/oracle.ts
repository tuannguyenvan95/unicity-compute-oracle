export interface TelemetryData {
  cpuUsage: number; // Percentage
  gpuUsage: number; // Percentage
  executionTimeMs: number;
  bandwidthMbps: number;
}

export class ComputeOracle {
  // Pricing parameters: UTKN per unit
  private readonly PRICE_PER_CPU_PERCENT_SEC = 0.05;
  private readonly PRICE_PER_GPU_PERCENT_SEC = 0.10;
  private readonly PRICE_PER_MBPS_SEC = 0.02;

  /**
   * Simulates fetching telemetry from AstridOS observability tools.
   */
  public async getTelemetry(): Promise<TelemetryData> {
    // In reality, this would hook into AstridOS process isolation metrics.
    // We simulate it with random fluctuations representing dynamic load.
    return {
      cpuUsage: Math.random() * 80 + 10, // 10% to 90%
      gpuUsage: Math.random() * 60, // 0% to 60%
      executionTimeMs: 1000, // Assuming a 1-second interval
      bandwidthMbps: Math.random() * 100 + 50, // 50 to 150 Mbps
    };
  }

  /**
   * Calculates dynamic pricing based on consumption.
   */
  public calculateCost(telemetry: TelemetryData): number {
    const seconds = telemetry.executionTimeMs / 1000;
    const cpuCost = telemetry.cpuUsage * this.PRICE_PER_CPU_PERCENT_SEC * seconds;
    const gpuCost = telemetry.gpuUsage * this.PRICE_PER_GPU_PERCENT_SEC * seconds;
    const bwCost = telemetry.bandwidthMbps * this.PRICE_PER_MBPS_SEC * seconds;

    const totalCost = cpuCost + gpuCost + bwCost;
    return Number(totalCost.toFixed(4));
  }
}
