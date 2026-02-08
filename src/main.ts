import 'dotenv/config';
import { baseSepoliaClient } from './config';
import { getAccountData } from './connectors/base-aave';
import executor from './agent';
import { privateKeyToAccount, createWalletClient, http } from 'viem/accounts';
import { baseSepolia } from './config';

// Risk monitoring parameters
const POLL_INTERVAL = 30000; // 30 seconds
const HF_THRESHOLD_LOW = 1.2;
const HF_THRESHOLD_HIGH = 2.0;

const walletClient = createWalletClient({
  account: privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}` || ''),
  chain: baseSepolia,
  transport: http(process.env.BASE_SEPOLIA_RPC)
});

const checkRiskState = async () => {
  const { healthFactor } = await getAccountData(walletClient.account.address);
  console.log(`Current Health Factor: ${healthFactor.toFixed(2)}`);

  if (healthFactor < HF_THRESHOLD_LOW || healthFactor > HF_THRESHOLD_HIGH) {
    const input = {
      walletAddress: walletClient.account.address,
      healthFactor,
      action: healthFactor < HF_THRESHOLD_LOW ? 'repay' : 'borrow'
    };

    try {
      const result = await executor.invoke(JSON.stringify(input));
      console.log('Agent decision:', result);
    } catch (error) {
      console.error('Agent execution failed:', error);
    }
  }
};

// Risk signal engine - polls Aave V3 for health factor changes
console.log('Starting risk monitoring engine...');
checkRiskState(); // Initial check
setInterval(checkRiskState, POLL_INTERVAL);