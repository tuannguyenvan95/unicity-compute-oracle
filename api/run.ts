import { ProviderAgent } from '../src/agent/provider.js';
import { ConsumerAgent } from '../src/agent/consumer.js';

export default async function handler(req: any, res: any) {
  // Initialize Agents for a single cycle
  const provider = new ProviderAgent("node_operator_01", 0);
  const consumer = new ConsumerAgent("ai_job_runner", 20.0);

  const selectedProviderTag = consumer.discoverAndConnect();
  
  if (!selectedProviderTag) {
    return res.status(500).json({ error: "No suitable provider found." });
  }

  provider.registerConsumer(consumer.identity.nametag);

  // Execute 1 billing cycle
  const pendingRequests = await provider.executeBillingCycle();
  
  const charges = [];
  for (const req of pendingRequests) {
    charges.push({
      from: provider.identity.nametag,
      to: consumer.identity.nametag,
      amount: req.amount
    });
    await consumer.handlePaymentRequest(req);
  }

  res.status(200).json({
    message: "Cycle Completed",
    marketplace: {
      optimalProvider: selectedProviderTag
    },
    billing: charges,
    ledger: {
      provider: provider.identity.wallet.balance,
      consumer: consumer.identity.wallet.balance
    }
  });
}
