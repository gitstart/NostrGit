import { createContext, useCallback, useContext, type ReactNode } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import { type OnEose, type OnEvent, RelayPool, type SubscriptionOptions } from "nostr-relaypool";
import { type Filter } from "nostr-tools";
import { nip19 } from "nostr-tools";


const defaultRelays = [
  "wss://relay.damus.io",
  "wss://nostr.fmt.wiz.biz",
  "wss://nostr.bongbong.com",
  "wss://nos.lol",
];


const relayPool = new RelayPool(defaultRelays);

const NostrContext = createContext<{
  subscribe?: typeof relayPool.subscribe,
  addReplay?: (url: string) => void,
  defaultRelays: string[],
  setAuthor?: (author: string) => void,
  pubkey: string | null,
}
>({ defaultRelays, pubkey: null });

export const useNostrContext = () => {
  const context = useContext(NostrContext);
  if (context === null) {
    throw new Error(
      "useNostrContext must be used within NostrProvider"
    );
  }
  return context;
};

const NostrProvider: React.FC<{ children: ReactNode}> = ({ children }) => { 
  const addReplay = useCallback((url: string) => {
    relayPool.addOrGetRelay(url);
  }, []);

  const replayPoolSubscribe = useCallback((
    filters: (Filter & {relay?: string; noCache?: boolean})[],
    relays: string[],
    onEvent: OnEvent,
    maxDelayms?: number,
    onEose?: OnEose,
    options: SubscriptionOptions = {}
  ) => {
    const unsub = relayPool.subscribe(filters, relays, onEvent, maxDelayms, onEose, options);
    return unsub;
  }, []);

  const [pubkey, setPubKey] = useLocalStorage<string | null>("npub", null);

  const setAuthor = useCallback((author: string) => {
    const {type, data} = (nip19 as unknown as { decode: (author: string) => {type: string, data: string}}).decode(author);
    if (type !== "npub") {
      throw new Error("Please use npub");
    }
    setPubKey(data);
  }, [setPubKey]);

  return (
  <NostrContext.Provider value={{
    subscribe: replayPoolSubscribe,
    addReplay,
    defaultRelays: defaultRelays,
    setAuthor,
    pubkey,
  }}>
    {children}
  </NostrContext.Provider>
  );
};

export default NostrProvider;