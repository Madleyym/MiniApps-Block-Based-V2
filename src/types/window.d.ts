import { EIP1193Provider } from "viem";

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
    sdk?: {
      wallet?: {
        ethProvider?: EIP1193Provider;
      };
      context?: Promise<any>;
      actions?: {
        ready: () => Promise<void>;
        openUrl: (url: string) => Promise<void>;
      };
    };
  }
}

export {};
