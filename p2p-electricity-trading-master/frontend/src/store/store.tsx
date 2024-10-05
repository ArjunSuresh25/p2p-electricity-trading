import { BrowserProvider, JsonRpcSigner } from "ethers";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type Trade = {
  id: string;
  type: "buy" | "sell";
  quantity: number;
  price: number;
  timeStamp: number;
  buyerId: string;
  sellerId: string;
  status: "completed" | "pending" | "in_progress" | "cancelled";
};

type Ethereum = {
  provider: BrowserProvider;
  signer: JsonRpcSigner;
  balance: string;
};

interface IGlobalState {
  user: { username: string; name: string; userId: string } | null;
  setUser: (user: NonNullable<IGlobalState["user"]>) => void;
  logOutUser: () => void;

  ethereum: Ethereum | null;

  tradeHistory: Trade[];

  prependTradeHistory: (trade: Trade) => void;
  setTradeHistory: (trades: Trade[]) => void;
  setEthereum: (ethereum: Ethereum) => void;
}

const useStore = create<IGlobalState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user: NonNullable<IGlobalState["user"]>) =>
        set(() => ({ user })),
      logOutUser: () => set(() => ({ user: null })),

      ethereum: null,

      tradeHistory: [],
      prependTradeHistory: (trade: Trade) =>
        set((state) => ({
          tradeHistory: [trade, ...state.tradeHistory],
        })),
      setTradeHistory: (trades: Trade[]) =>
        set(() => ({
          tradeHistory: trades,
        })),
      setEthereum: (ethereum) =>
        set(() => ({
          ethereum,
        })),
    }),
    { name: "user-details" }
  )
);

export default useStore;
