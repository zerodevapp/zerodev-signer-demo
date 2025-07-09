import { TransactionSerializable, formatEther, formatGwei } from 'viem';

export type TransactionDialogProps = {
  transaction: TransactionSerializable;
  onReject: () => void;
  onConfirm: () => void;
};

export function TransactionDialog({
  transaction,
  onReject,
  onConfirm,
}: TransactionDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Confirm Transaction
        </h2>

        <div className="space-y-3 mb-6">
          <div>
            <label className="block text-sm font-bold text-gray-700">
              Chain
            </label>
            <p className="text-sm text-gray-900">Sepolia</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700">To</label>
            <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded break-all">
              {transaction.to}
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700">
              Data
            </label>
            <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded break-all">
              {transaction.data ?? '0x'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700">
              Value
            </label>
            <p className="text-sm text-gray-900">
              {formatEther(transaction.value ?? BigInt(0))} ETH
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700">
              Gas Limit
            </label>
            <p className="text-sm text-gray-900">{transaction.gas}</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700">
              Max Fee Per Gas
            </label>
            <p className="text-sm text-gray-900">
              {formatGwei(transaction.maxFeePerGas)} Gwei
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700">
              Max Priority Fee
            </label>
            <p className="text-sm text-gray-900">
              {formatGwei(transaction.maxPriorityFeePerGas)} Gwei
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700">
              Nonce
            </label>
            <p className="text-sm text-gray-900">{transaction.nonce ?? 0}</p>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onReject}
            className="flex-1 bg-gray-200 cursor-pointer text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          >
            Reject
          </button>

          <button
            onClick={onConfirm}
            className="flex-1 bg-blue-600 cursor-pointer text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
