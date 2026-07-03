// Mocking the sphere-sdk primitives for Unicity Testnet

export class Wallet {
  public address: string;
  public balance: number;

  constructor(address: string, initialBalance: number = 0) {
    this.address = address;
    this.balance = initialBalance;
  }

  async transfer(to: string, amount: number): Promise<boolean> {
    if (this.balance >= amount) {
      this.balance -= amount;
      return true;
    }
    return false;
  }
}

export class Identity {
  public nametag: string;
  public wallet: Wallet;

  constructor(nametag: string, wallet: Wallet) {
    this.nametag = nametag;
    this.wallet = wallet;
  }
}

export interface PaymentRequest {
  id: string;
  from: string; // Requester Nametag
  to: string; // Payer Nametag
  amount: number;
  reason: string;
  status: 'PENDING' | 'PAID' | 'REJECTED';
}

export interface ServiceListing {
  providerNametag: string;
  basePrice: number;
  maxComputeCapacity: number;
}

export class SphereNetwork {
  private static identities: Map<string, Identity> = new Map();
  private static paymentRequests: Map<string, PaymentRequest> = new Map();
  private static serviceRegistry: Map<string, ServiceListing> = new Map();

  static registerIdentity(identity: Identity) {
    this.identities.set(identity.nametag, identity);
  }

  static getIdentity(nametag: string): Identity | undefined {
    return this.identities.get(nametag);
  }

  static registerService(listing: ServiceListing) {
    this.serviceRegistry.set(listing.providerNametag, listing);
  }

  static getAvailableServices(): ServiceListing[] {
    return Array.from(this.serviceRegistry.values());
  }

  static createPaymentRequest(from: string, to: string, amount: number, reason: string): PaymentRequest {
    const request: PaymentRequest = {
      id: Math.random().toString(36).substring(7),
      from,
      to,
      amount,
      reason,
      status: 'PENDING'
    };
    this.paymentRequests.set(request.id, request);
    return request;
  }

  static async settlePaymentRequest(requestId: string): Promise<boolean> {
    const request = this.paymentRequests.get(requestId);
    if (!request) return false;

    const payer = this.getIdentity(request.to);
    const payee = this.getIdentity(request.from);

    if (!payer || !payee) return false;

    const success = await payer.wallet.transfer(payee.wallet.address, request.amount);
    if (success) {
      payee.wallet.balance += request.amount;
      request.status = 'PAID';
      return true;
    } else {
      request.status = 'REJECTED';
      return false;
    }
  }
}
