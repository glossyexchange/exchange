// hooks/useAccountSelectionModal.ts
import { useAppDispatch } from '@/store/hooks';
import { searchAccounts } from '@/store/Reducers/accountReducer';
import { sortAccountsByAccountId } from '@/utils/accountUtils';
import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';


interface Account {
  accountId: number;
  name: string;
}

const useAccountSelectionModal = () => {
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [accountsList, setAccountsList] = useState<Account[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const dispatch = useAppDispatch(); 

  const fetchAccountsForModal = useCallback(async (searchTerm = "") => {
    setModalLoading(true);
    try {
     const result = await dispatch(
           searchAccounts({ searchValue: searchTerm }),
         ).unwrap();
         
      if (result.accounts) {
        const sortedAccounts = sortAccountsByAccountId(result.accounts);
        setAccountsList(sortedAccounts);
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      toast.error('Failed to load accounts');
    } finally {
      setModalLoading(false);
    }
  }, [dispatch]);

  const handleModalSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setModalSearchTerm(value);
    // Debounce the search (optional)
    fetchAccountsForModal(value);
  }, [fetchAccountsForModal]);

  const openModal = useCallback(() => {
    setIsAccountModalOpen(true);
    fetchAccountsForModal('');
  }, [fetchAccountsForModal]);

  const closeModal = useCallback(() => {
    setIsAccountModalOpen(false);
    setModalSearchTerm('');
  }, []);

  return {
    isAccountModalOpen,
    modalSearchTerm,
    accountsList,
    modalLoading,
    openModal,
    closeModal,
    handleModalSearch,
    fetchAccountsForModal,
    setAccountsList,
  };
};

export default useAccountSelectionModal;