import { ComputeOracle } from '../oracle/oracle';
import { Identity, SphereNetwork, Wallet } from '../mocks/sphere-sdk';
import type { PaymentRequest } from '../mocks/sphere-sdk';

export class ProviderAgent {
  public identity: Identity;
  private oracle: ComputeOracle;
  private activeConsumers: Set<string>;

  constructor(nametag: string, initialBalance: number) {
    const wallet = new Wallet(`${nametag}_wallet_addr`, initialBalance);
    this.identity = new Identity(nametag, wallet);
    this.oracle = new ComputeOracle();
    this.activeConsumers = new Set();
    
    // Register to Sphere Network
    SphereNetwork.registerIdentity(this.identity);
    
    // Broadcast availability to the Service Registry
    SphereNetwork.registerService({
      providerNametag: this.identity.nametag,
      basePrice: 0.15, // Base theoretical UTKN price factor
      maxComputeCapacity: 100 // Maximum 100 concurrent compute threads
    });
  }

  public registerConsumer(consumerNametag: string) {
    this.activeConsumers.add(consumerNametag);
    console.log(`[Provider] Consumer ${consumerNametag} registered for compute resources.`);
  }

  /**
   * The main event loop for the Provider Agent.
   * Runs at a set interval, reading telemetry, calculating cost, and issuing payment requests.
   */
  public async executeBillingCycle(): Promise<PaymentRequest[]> {
    if (this.activeConsumers.size === 0) return [];

    // 1. Fetch Telemetry
    const telemetry = await this.oracle.getTelemetry();
    console.log(`[Provider] Telemetry metrics: CPU=${telemetry.cpuUsage.toFixed(1)}%, GPU=${telemetry.gpuUsage.toFixed(1)}%, BW=${telemetry.bandwidthMbps.toFixed(1)}Mbps`);

    // 2. Calculate dynamic pricing cost
    const cost = this.oracle.calculateCost(telemetry);
    console.log(`[Provider] Calculated Cost: ${cost} UTKN per active consumer`);

    const requests: PaymentRequest[] = [];

    // 3. Issue Payment Requests to all active consumers using sphere-sdk primitive
    for (const consumer of this.activeConsumers) {
      const request = SphereNetwork.createPaymentRequest(
        this.identity.nametag,
        consumer,
        cost,
        'Compute Resource Consumption'
      );
      requests.push(request);
    }

    return requests;
  }
}
