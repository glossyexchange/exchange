// components/AccountSelectionModal.tsx
import { AccountGet } from "@/types/accountTypes";
import { PropagateLoader } from "react-spinners";

interface Account {
  accountId: number;
  name: string;
  // Add other fields if needed
}

interface AccountSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange?: (value: string) => void;
  onSearchInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  accounts: AccountGet[];
  loading: boolean;
  onAccountSelect: (account: AccountGet) => void;
  noAccountsMessage: string;
  accountIdColumnText: string;
  accountNameColumnText: string;
  cancelButtonText: string;
}

const AccountSelectionModal: React.FC<AccountSelectionModalProps> = ({
  isOpen,
  onClose,
  title,
  searchPlaceholder,
  searchValue,
 onSearchChange,
  onSearchInputChange,
  accounts,
  loading,
  onAccountSelect,
  noAccountsMessage,
  accountIdColumnText,
  accountNameColumnText,
  cancelButtonText,
}) => {
  if (!isOpen) return null;

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (onSearchInputChange) {
      onSearchInputChange(e);
    } else if (onSearchChange) {
      onSearchChange(value);
    }
  };

  const handleAccountClick = (account: AccountGet) => {
    onAccountSelect(account);
  };

  const handleKeyDown = (e: React.KeyboardEvent, account: AccountGet) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleAccountClick(account);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-8/12 max-w-3xl rounded-lg bg-white px-6 py-3">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-md font-bold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md bg-red-500 px-2 py-[3px] text-white hover:bg-gray-400"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Search Input */}
        <div className="mb-4 w-full md:w-6/12">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={handleSearchInputChange}
            className="w-full rounded-md border border-gray-300 px-3 py-[6px] placeholder:text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>

        {/* Accounts Table */}
        <div className="max-h-96 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-lightBlue sticky top-0">
              <tr>
                <th className="px-6 py-3 text-start text-xs font-bold uppercase tracking-wider text-gray-500">
                  {accountIdColumnText}
                </th>
                <th className="px-6 py-3 text-start text-xs font-bold uppercase tracking-wider text-gray-500">
                  {accountNameColumnText}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={2} className="px-6 py-8 text-center">
                    <div className="flex ">
                      <PropagateLoader color="#319368" size={10} />
                    </div>
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
                    {noAccountsMessage}
                  </td>
                </tr>
              ) : (
                accounts.map((account) => (
                  <tr
                    key={account.accountId}
                    onClick={() => handleAccountClick(account)}
                    onKeyDown={(e) => handleKeyDown(e, account)}
                    className="cursor-pointer hover:bg-gray-50"
                    tabIndex={0}
                    role="button"
                    aria-label={`Select account ${account.accountId} - ${account.name}`}
                  >
                    <td className="whitespace-nowrap px-6 py-2 text-start text-sm text-gray-900">
                      {account.accountId}
                    </td>
                    <td className="whitespace-nowrap px-6 py-2 text-start text-sm text-gray-900">
                      {account.name}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded bg-red-500 px-3 py-[4px] font-medium text-white hover:bg-gray-600 hover:text-white disabled:opacity-75 md:w-auto"
          >
            {cancelButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountSelectionModal;