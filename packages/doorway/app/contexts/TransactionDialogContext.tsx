'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { TransactionSerializable } from 'viem';

import { TransactionDialog } from '../components/TransactionDialog';

type TransactionDialogContextType = {
  openDialog: (data: TransactionSerializable) => Promise<boolean>;
};

const TransactionDialogContext = createContext<
  TransactionDialogContextType | undefined
>(undefined);

export function TransactionDialogProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [transaction, setTransaction] =
    useState<TransactionSerializable | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(
    null
  );

  const openDialog = (data: TransactionSerializable): Promise<boolean> => {
    return new Promise((resolve) => {
      setTransaction(data);
      setResolver(() => resolve);
    });
  };

  const handleReject = () => {
    if (resolver) {
      resolver(false);
    }

    setResolver(null);
    setTransaction(null);
  };

  const handleConfirm = () => {
    if (resolver) {
      resolver(true);
    }

    setResolver(null);
    setTransaction(null);
  };

  return (
    <TransactionDialogContext.Provider value={{ openDialog }}>
      {children}
      {transaction && (
        <TransactionDialog
          transaction={transaction}
          onReject={handleReject}
          onConfirm={handleConfirm}
        />
      )}
    </TransactionDialogContext.Provider>
  );
}

export function useTransactionDialog() {
  const context = useContext(TransactionDialogContext);
  if (context === undefined) {
    throw new Error(
      'useTransactionDialog must be used within a TransactionDialogProvider'
    );
  }
  return context;
}
