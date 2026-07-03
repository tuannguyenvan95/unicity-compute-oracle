import { Identity, SphereNetwork, Wallet } from '../mocks/sphere-sdk.ts';
import type { PaymentRequest } from '../mocks/sphere-sdk.ts';

export class ConsumerAgent {
  public identity: Identity;

  constructor(nametag: string, initialBalance: number) {
    const wallet = new Wallet(`${nametag}_wallet_addr`, initialBalance);
    this.identity = new Identity(nametag, wallet);
    
    // Register to Sphere Network
    SphereNetwork.registerIdentity(this.identity);
  }

  /**
   * Autonomously discovers the best compute provider on the network and connects to them.
   * Returns the nametag of the connected provider, or null if none found.
   */
  public discoverAndConnect(): string | null {
    console.log(`\n[Consumer ${this.identity.nametag}] Scanning Service Registry for Compute Providers...`);
    const availableServices = SphereNetwork.getAvailableServices();
    
    if (availableServices.length === 0) {
      console.log(`[Consumer ${this.identity.nametag}] No providers available.`);
      return null;
    }

    // Agent Intelligence: Sort providers by lowest base price, and having capacity > 0
    const optimalProvider = availableServices
      .filter(s => s.maxComputeCapacity > 0)
      .sort((a, b) => a.basePrice - b.basePrice)[0];

    if (optimalProvider) {
      console.log(`[Consumer ${this.identity.nametag}] Selected optimal provider: ${optimalProvider.providerNametag} (Base Price: ${optimalProvider.basePrice})`);
      return optimalProvider.providerNametag;
    }

    console.log(`[Consumer ${this.identity.nametag}] No suitable providers found.`);
    return null;
  }

  /**
   * Automatically process an incoming payment request (No human in the loop)
   */
  public async handlePaymentRequest(request: PaymentRequest): Promise<void> {
    console.log(`[Consumer ${this.identity.nametag}] Received payment request ${request.id} for ${request.amount} UTKN`);
    
    // Basic agentic constraint: ensure we don't spend more than we have
    if (this.identity.wallet.balance >= request.amount) {
      console.log(`[Consumer ${this.identity.nametag}] Auto-approving payment request ${request.id}...`);
      const success = await SphereNetwork.settlePaymentRequest(request.id);
      if (success) {
        console.log(`[Consumer ${this.identity.nametag}] Successfully settled request ${request.id}. New Balance: ${this.identity.wallet.balance.toFixed(4)} UTKN`);
      } else {
        console.log(`[Consumer ${this.identity.nametag}] Failed to settle request ${request.id}`);
      }
    } else {
      console.warn(`[Consumer ${this.identity.nametag}] Insufficient balance to cover request ${request.id}. Disconnecting from Provider.`);
      // In a real system, the consumer would notify the provider to stop sending data/compute.
    }
  }
}
