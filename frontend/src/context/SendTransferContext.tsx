import React, { createContext, ReactNode, useContext, useState } from 'react';

// Define the shape of a single send transfer item
interface SendTransfer {
  id: number;
  voucherNo: number;
  createdAt: string | Date;
  currencyId: number;
  ComSender_ID: number;
  HmulafromComSender?: number;
  ComeReciever_ID: number;
  HmulafromComReciever?: number;
  HmulatoComReciever?: number;
  RecieverPerson?: string;
  RecieverAddress?: string;
  RecieverPhone?: string;
  SenderPerson?: string;
  SenderAddress?: string;
  SenderPhone?: string;
  AmountTransfer: number;
  HmulatoComSender?: number;
  TotalTransferToReceiver: number;
  Notes?: string;
  USER_ID: number;
  addressID?: number;
  transferTypeId: number;
  
  // Optional relation fields (if included)
  currency?: {
    currency: string;
  };
  sender?: {
    name: string;
    phone: string;
    address: string;
  };
  receiver?: {
    name: string;
    phone: string;
    address: string;
  };
}

// Define the cache entry structure
interface CacheEntry {
  data: SendTransfer;
  timestamp: number;
  isFromCancelledTransfer?: boolean; // Add this flag
}

// Define the context value type
interface SendTransferContextValue {
  cacheTransfer: (transferData: SendTransfer, isFromCancelledTransfer?: boolean) => void;
  getCachedTransfer: (voucherNo: number) => { 
    data: SendTransfer; 
    isFromCancelledTransfer?: boolean 
  } | null;
  clearCache: (voucherNo?: number | null) => void;
  getCacheStats: () => { size: number; entries: [number, CacheEntry][] };
}

// Create context with proper typing
const SendTransferContext = createContext<SendTransferContextValue | undefined>(undefined);

// Props for the provider component
interface SendTransferProviderProps {
  children: ReactNode;
}

export const SendTransferProvider: React.FC<SendTransferProviderProps> = ({ children }) => {
  const [transferCache, setTransferCache] = useState<Map<number, CacheEntry>>(new Map());

  const cacheTransfer = (transferData: SendTransfer, isFromCancelledTransfer = false): void => {
    const key = transferData.voucherNo;
    
    console.log(`📦 Cache SET: Voucher ${key}, isCancelled: ${isFromCancelledTransfer}`);
    
    setTransferCache(prev => {
      const newCache = new Map(prev);
      newCache.set(key, {
        data: transferData,
        timestamp: Date.now(),
        isFromCancelledTransfer
      });
      return newCache;
    });
  };

  const getCachedTransfer = (voucherNo: number): { data: SendTransfer; isFromCancelledTransfer?: boolean } | null => {
    const cached = transferCache.get(voucherNo);
    
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
      console.log(`📦 Cache GET: Voucher ${voucherNo}, isCancelled: ${cached.isFromCancelledTransfer}`);
      return {
        data: cached.data,
        isFromCancelledTransfer: cached.isFromCancelledTransfer
      };
    }
    
    // Clean up expired entry
    if (cached) {
      setTransferCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(voucherNo);
        return newCache;
      });
    }
    
    return null;
  };


  const clearCache = (voucherNo?: number | null): void => {
    if (voucherNo) {
      setTransferCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(voucherNo);
        return newCache;
      });
    } else {
      setTransferCache(new Map());
    }
  };

  const getCacheStats = (): { size: number; entries: [number, CacheEntry][] } => {
    return {
      size: transferCache.size,
      entries: Array.from(transferCache.entries())
    };
  };

  const value: SendTransferContextValue = {
    cacheTransfer,
    getCachedTransfer,
    clearCache,
    getCacheStats
  };

  return (
    <SendTransferContext.Provider value={value}>
      {children}
    </SendTransferContext.Provider>
  );
};

// Custom hook with error handling
export const useSendTransferCache = (): SendTransferContextValue => {
  const context = useContext(SendTransferContext);
  if (context === undefined) {
    throw new Error('useSendTransferCache must be used within a SendTransferProvider');
  }
  return context;
};

// Optional: Create a utility function to validate SendTransfer data
export const isValidSendTransfer = (data: unknown): data is SendTransfer => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'voucherNo' in data &&
    typeof (data as any).voucherNo === 'number'
  );
};

// Optional: Helper to safely parse from localStorage/sessionStorage
export const parseSendTransferFromStorage = (key: string): SendTransfer | null => {
  try {
    const item = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (!item) return null;
    
    const parsed = JSON.parse(item);
    if (isValidSendTransfer(parsed)) {
      return parsed;
    }
    // If invalid, clear it
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
    return null;
  } catch (error) {
    console.error('Error parsing send transfer from storage:', error);
    return null;
  }
};