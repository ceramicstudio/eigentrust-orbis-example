import { create } from "zustand";
import {
  type IEVMProvider,
  OrbisDB,
  type OrbisConnectResult,
} from "@useorbis/db-sdk";
import { OrbisEVMAuth } from "@useorbis/db-sdk/auth";

const NEXT_PUBLIC_ENV_ID = process.env.NEXT_PUBLIC_ENV_ID ?? "";

declare global {
  interface Window {
    ethereum?: IEVMProvider;
  }
}

type Store = {
  orbis: OrbisDB;
  orbisSession?: OrbisConnectResult | undefined;
  // setOrbisSession returns a promise
  setAuth: (
    wallet: IEVMProvider | undefined
  ) => Promise<OrbisConnectResult | undefined>;
  setOrbisSession: (session: OrbisConnectResult | undefined) => void;
};

const StartOrbisAuth = async (
  walletClient: IEVMProvider,
  orbis: OrbisDB
): Promise<OrbisConnectResult | undefined> => {
  console.log("Starting Orbis Auth");
  let authResult: OrbisConnectResult | undefined;
  if (walletClient) {
    // first check if existing session
    const existingSession = localStorage.getItem("orbis:session");
    if (existingSession) {
      authResult = await orbis.connectUser({
        serializedSession: existingSession,
      });
    } else {
      const auth = new OrbisEVMAuth(window.ethereum!);
      // Authenticate - this option persists the session in local storage
      authResult = await orbis.connectUser({
        auth,
      });
    }

    if (authResult.auth.session) {
      console.log("Orbis Auth'd:", authResult.auth.session);
      return authResult;
    }
  }

  return undefined;
};

const useStore = create<Store>((set) => ({
  orbis: new OrbisDB({
    ceramic: {
      gateway: "https://ceramic-orbisdb-mainnet-direct.hirenodes.io/",
    },
    nodes: [
      {
        gateway: "https://studio.useorbis.com",
        env: NEXT_PUBLIC_ENV_ID,
      },
    ],
  }),
  orbisSession: undefined,
  setAuth: async (wallet) => {
    if (wallet) {
      try {
        const auth = await StartOrbisAuth(wallet, useStore.getState().orbis);
        set((state: Store) => ({
          ...state,
          orbisSession: auth,
        }));
        return auth;
      } catch (err) {
        console.error(err);
      }
    } else {
      set((state: Store) => ({
        ...state,
        session: undefined,
      }));
    }
  },
  setOrbisSession: (session) =>
    set((state: Store) => ({
      ...state,
      orbisSession: session,
    })),
}));

export default useStore;
