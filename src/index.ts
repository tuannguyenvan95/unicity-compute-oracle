import { ProviderAgent } from './agent/provider.ts';
import { ConsumerAgent } from './agent/consumer.ts';

// ANSI Escapes for colors
const ANSI = {
  RESET: "\x1b[0m",
  BOLD: "\x1b[1m",
  CYAN: "\x1b[36m",
  GREEN: "\x1b[32m",
  YELLOW: "\x1b[33m",
  RED: "\x1b[31m",
  MAGENTA: "\x1b[35m",
  CLEAR_SCREEN: "\x1b[2J\x1b[H"
};

async function bootstrap() {
  process.stdout.write(ANSI.CLEAR_SCREEN);
  console.log(`${ANSI.BOLD}${ANSI.CYAN}====================================================${ANSI.RESET}`);
  console.log(`${ANSI.BOLD}${ANSI.MAGENTA}         UNICITY TESTNET AUTONOMOUS ORACLE          ${ANSI.RESET}`);
  console.log(`${ANSI.BOLD}${ANSI.CYAN}====================================================${ANSI.RESET}\n`);

  // Initialize multiple Providers to populate the market registry
  const provider1 = new ProviderAgent("node_operator_01", 0);
  const provider2 = new ProviderAgent("datacenter_alpha", 0); // Imagine this registers with different specs in a more complex setup
  
  // Initialize Consumer
  const consumer = new ConsumerAgent("ai_job_runner", 20.0); // Starts with 20 UTKN

  // 1. Dynamic Market Discovery
  const selectedProviderTag = consumer.discoverAndConnect();
  if (!selectedProviderTag) {
    console.log(`${ANSI.RED}[Error] Could not find a suitable provider. Exiting.${ANSI.RESET}`);
    return;
  }

  // Register Consumer with the optimal provider
  const optimalProvider = selectedProviderTag === "node_operator_01" ? provider1 : provider2;
  optimalProvider.registerConsumer(consumer.identity.nametag);

  console.log(`\n${ANSI.BOLD}${ANSI.YELLOW}Starting automated P2P billing loop...${ANSI.RESET}`);

  let cycles = 0;
  const maxCycles = 5;

  const loop = setInterval(async () => {
    cycles++;
    console.log(`\n${ANSI.BOLD}${ANSI.CYAN}--- Billing Cycle ${cycles} ---${ANSI.RESET}`);
    
    // Provider executes billing cycle
    const pendingRequests = await optimalProvider.executeBillingCycle();

    // Consumer processes incoming requests programmatically
    for (const req of pendingRequests) {
      // Colorize the output based on amount
      const amountStr = `${ANSI.YELLOW}${req.amount.toFixed(4)} UTKN${ANSI.RESET}`;
      console.log(`[P2P Ledger] Stream Billing: ${optimalProvider.identity.nametag} -> ${consumer.identity.nametag} | Charge: ${amountStr}`);
      await consumer.handlePaymentRequest(req);
    }

    // Live Ledger Dashboard
    console.log(`\n${ANSI.GREEN}[Live Ledger]${ANSI.RESET}`);
    console.log(`  Provider (${optimalProvider.identity.nametag}): ${ANSI.BOLD}${optimalProvider.identity.wallet.balance.toFixed(4)} UTKN${ANSI.RESET}`);
    console.log(`  Consumer (${consumer.identity.nametag}): ${ANSI.BOLD}${consumer.identity.wallet.balance.toFixed(4)} UTKN${ANSI.RESET}`);

    if (cycles >= maxCycles || consumer.identity.wallet.balance <= 0) {
      clearInterval(loop);
      console.log(`\n${ANSI.BOLD}${ANSI.CYAN}====================================================${ANSI.RESET}`);
      console.log(`${ANSI.BOLD}${ANSI.MAGENTA}               SIMULATION COMPLETE                  ${ANSI.RESET}`);
      console.log(`${ANSI.BOLD}${ANSI.CYAN}====================================================${ANSI.RESET}\n`);
    }
  }, 1500); // 1.5-second interval for simulation observability
}

bootstrap().catch(console.error);
