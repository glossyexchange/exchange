import React, {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { FaBan, FaEdit } from "react-icons/fa";
import { IoMdCloseCircle } from "react-icons/io";
import { PropagateLoader } from "react-spinners";

import useInputFocusManager from "@/hooks/useInputFocusManager";
import { getAllAccountTypes } from "@/store/Reducers/accountTypeReducer";
import { useAppDispatch } from "@/store/hooks";
import { RootState } from "@/store/rootReducers";
import { overrideStyle } from "@/utils/utils";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { BiSave } from "react-icons/bi";
import { useSelector } from "react-redux";
import {
  createAccount,
  getAllAccounts,
  getLastAccountId,
  messageClear,
  updateAccount,
} from "../../store/Reducers/accountReducer";
import Pagination from "../Pagination";

interface FormState {
  accountId: number;
  name: string;
  phone: string;
  address: string;
  accountTypeId: number;
}

const Accounts: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const isRTL = currentLanguage === "ar" || currentLanguage === "kr";
  const dispatch = useAppDispatch();

  const submitButtonRef = useRef<HTMLButtonElement>(null);

  // Use your custom hook - define the number of inputs in sequence
  const { registerRef, getKeyDownHandler, getChangeHandler } =
    useInputFocusManager(5, {
      buttonRef: submitButtonRef,
      autoFocusOnChange: true,
      onLastInputEnter: () => {
        // Optional: If you want to submit form on last input Enter
      },
    });

  const { loader, successMessage, errorMessage, accounts, totalAccounts } =
    useSelector((state: RootState) => state.account);
  const { accountTypes } = useSelector((state: RootState) => state.accountType);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchValue, setSearchValue] = useState<string>("");
  const [parPage, setParPage] = useState<number>(20);
  const [show, setShow] = useState<boolean>(false);
  const [accountIdEdit, setAccountIdEdit] = useState<number>(0);

  const [addEdit, setAddEdit] = useState<boolean>(false);
  const [needsFocus, setNeedsFocus] = useState(false);

  // useEffect(() => {
  //   if (needsFocus && submitButtonRef.current) {
  //     submitButtonRef.current.focus();
  //     setNeedsFocus(false);
  //   }
  // }, [needsFocus]);

  const [state, setState] = useState<FormState>({
    accountId: 0,
    name: "",
    phone: "",
    address: "",
    accountTypeId: 0,
  });

  const abortControllers = useRef<Map<number, AbortController>>(new Map());
  const accountIdCache = useRef<Map<number, number>>(new Map());

  const handleGetLastAccount = useCallback(
    (accountTypeId: number) => {
      setState((prev) => ({ ...prev, accountId: 0 }));
      if (accountTypeId <= 0) return;

      const cachedId = accountIdCache.current.get(accountTypeId);
      if (cachedId !== undefined) {
        setState((prev) => ({ ...prev, accountId: cachedId }));
        return;
      }

      const existingController = abortControllers.current.get(accountTypeId);
      if (existingController) {
        existingController.abort();
        abortControllers.current.delete(accountTypeId);
      }

      const controller = new AbortController();
      abortControllers.current.set(accountTypeId, controller);

      dispatch(
        getLastAccountId({
          accountTypeID: accountTypeId,
          signal: controller.signal,
        }),
      )
        .unwrap()
        .then((response) => {
          if (!controller.signal.aborted) {
            const accountId = response.data.accountId;
            accountIdCache.current.set(accountTypeId, accountId);
            setState((prev) => ({ ...prev, accountId }));
          }
        })
        .catch((error) => {
          if (error.name !== "AbortError") {
            console.error("Failed to get last account:", error);
          }
        })
        .finally(() => {
          abortControllers.current.delete(accountTypeId);
        });
    },
    [dispatch],
  );

  // Fixed useEffect cleanup
  useEffect(() => {
    const currentAbortControllers = abortControllers.current;

    return () => {
      currentAbortControllers.forEach((controller) => controller.abort());
      currentAbortControllers.clear();
    };
  }, []);

  useEffect(() => {
    setParPage(20);
    const obj = {
      parPage: parseInt(parPage.toString()),
      page: parseInt(currentPage.toString()),
      searchValue,
    };
    dispatch(getAllAccounts(obj));
    dispatch(getAllAccountTypes(obj));
  }, [searchValue, currentPage, parPage, dispatch]);

  const add_account = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (accountIdEdit) {
      const info = {
        name: state.name,
        phone: state.phone,
        address: state.address,
        accountTypeId: state.accountTypeId,
      };
      dispatch(
        updateAccount({
          accountId: Number(accountIdEdit),
          info,
        }),
      );
    } else {
      const info = {
        accountId: state.accountId,
        name: state.name,
        phone: state.phone,
        address: state.address,
        accountTypeId: state.accountTypeId,
      };
      dispatch(createAccount(info));
    }
  };

  // const handleDeleteCategory = (id: number) => {
  //   if (window.confirm(t("currencyS.delete_confirm") || "Are you sure?")) {
  //     dispatch(deleteAccount({ accountId: id }));
  //   }
  // };

  const ClearAll = () => {
    setState({
      accountId: 0,
      name: "",
      phone: "",
      address: "",
      accountTypeId: 0,
    });

    setAccountIdEdit(0);
    // setAccountName("");
    setAddEdit(false);
  };

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);

      const obj = {
        parPage: parseInt(parPage.toString()),
        page: parseInt(currentPage.toString()),
        searchValue,
      };
      dispatch(getAllAccounts(obj));
      dispatch(getAllAccountTypes(obj));
      accountIdCache.current.delete(state.accountTypeId);
      dispatch(messageClear());
      ClearAll();
    }
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
    }
  }, [successMessage, errorMessage]);

  return (
    <div className="px-2 pb-5 lg:px-4">
      <div className="grid w-full grid-cols-1 gap-7 pb-3 pl-3 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
        <h2 className="text-lg font-medium text-[#5c5a5a]">
          {t("categoryS.categories")}
        </h2>
      </div>
      <div className="mb-5 flex items-center justify-between rounded-md bg-[#ffffff] p-4 shadow-md lg:hidden">
        <h1 className="text-lg font-semibold text-[#5c5a5a]">
          {t("categoryS.categories")}
        </h1>
        <button
          onClick={() => setShow(true)}
          className="cursor-pointer rounded-sm bg-[#2ba460] px-4 py-2 text-sm text-white shadow-lg hover:shadow-[#304539]"
        >
          {t("categoryS.add_category")}
        </button>
      </div>

      <div className="flex w-full flex-wrap ">
        <div
          className={`translate-x-100 fixed w-[320px] lg:relative lg:right-0 lg:w-3/12 ${
            show ? "right-0 z-[9999]" : "-right-[340px]"
          }  top-16 transition-all duration-500 lg:top-0 `}
        >
          <div className="w-full pl-5 lg:px-3">
            <div className="h-screen bg-[#eef1f3] px-3 py-2 text-[#595b5d] shadow-md lg:h-auto lg:rounded-md lg:bg-[#ffffff] ">
              <div className="mb-4 flex items-center justify-between">
                <h1 className="text-md mb-4 w-full text-center font-semibold text-[#595b5d] ">
                  {t("categoryS.add_category")}
                </h1>

                <div onClick={() => setShow(false)} className="block lg:hidden">
                  <IoMdCloseCircle size={34} />
                </div>
              </div>

              <div className="relative mb-4 flex w-full  flex-col justify-start gap-1">
                <label htmlFor="role">
                  {t("categoryS.select_accout_type")}
                </label>
                <select
                  ref={registerRef(0)}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setState({ ...state, accountTypeId: value });
                    handleGetLastAccount(value);
                    // setNeedsFocus(true);
                    const changeHandler = getChangeHandler(0);
                    changeHandler(e);
                  }}
                  onKeyDown={getKeyDownHandler(0)}
                  value={state.accountTypeId || ""}
                  id="role"
                  className="rounded-md border border-slate-400 bg-[#ffffff] px-3 py-1 text-sm font-medium text-[#000000] focus:border-secondary"
                  required
                >
                  <option value="">{t("categoryS.select_accoutType")}</option>
                  {accountTypes?.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.type}
                    </option>
                  ))}
                </select>
              </div>
              <form onSubmit={add_account}>
                <div className="mb-3 flex w-full flex-col gap-1">
                  <label htmlFor="accountId">
                    {" "}
                    {t("categoryS.account_id")}
                  </label>
                  <input
                    ref={registerRef(1)}
                    value={state.accountId}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setState({ ...state, accountId: value });
                    }}
                    onKeyDown={getKeyDownHandler(1)}
                    required
                    className="rounded-md border border-[#bcb9b9] bg-[#ffffff] px-4 py-2 text-[#000000] outline-none focus:border-[#969494]"
                    type="number"
                    id="accountId"
                    name="accountId"
                    disabled={addEdit ? true : false}
                    // placeholder={t('categoryS.en_name')}
                  />
                </div>
                <div className="mb-3 flex w-full flex-col gap-1">
                  <label htmlFor="name"> {t("categoryS.name")}</label>
                  <input
                    ref={registerRef(2)}
                    value={state.name}
                    onChange={(e) => {
                      setState({ ...state, name: e.target.value });
                    }}
                    onKeyDown={getKeyDownHandler(2)}
                    required
                    className="rounded-md border border-[#bcb9b9] bg-[#ffffff] px-4 py-2 text-[#000000] outline-none focus:border-[#969494]"
                    type="text"
                    id="name"
                    name="name"
                    autoComplete="name"
                    // placeholder={t('categoryS.ku_name')}
                  />
                </div>
                <div className="mb-3 flex w-full flex-col gap-1">
                  <label htmlFor="phone"> {t("categoryS.phone")}</label>
                  <input
                    ref={registerRef(3)}
                    value={state.phone}
                    onChange={(e) => {
                      setState({ ...state, phone: e.target.value });
                    }}
                    onKeyDown={getKeyDownHandler(3)}
                    required
                    className="rounded-md border border-[#bcb9b9] bg-[#ffffff] px-4 py-2 text-[#000000] outline-none focus:border-[#969494]"
                    type="text"
                    id="phone"
                    name="phone"
                    autoComplete="tel"
                    // placeholder={t('categoryS.ar_name')}
                  />
                </div>
                <div className="mb-3 flex w-full flex-col gap-1">
                  <label htmlFor="address"> {t("categoryS.address")}</label>
                  <input
                    ref={registerRef(4)}
                    value={state.address}
                    onChange={(e) => {
                      setState({ ...state, address: e.target.value });
                    }}
                    onKeyDown={getKeyDownHandler(4)}
                    required
                    className="rounded-md border border-[#bcb9b9] bg-[#ffffff] px-4 py-2 text-[#000000] outline-none focus:border-[#969494]"
                    type="text"
                    id="address"
                    name="address"
                    autoComplete="address"
                    // placeholder={t('categoryS.ar_name')}
                  />
                </div>

                <div>
                  <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2">
                    <button
                      ref={submitButtonRef}
                      disabled={loader ? true : false}
                      className="mb-3 flex items-center justify-between rounded-md  bg-[#319368] px-4 py-2 text-white hover:bg-primary"
                    >
                      {loader ? (
                        <PropagateLoader
                          color="#fff"
                          cssOverride={overrideStyle}
                        />
                      ) : (
                        <>
                          {addEdit
                            ? <>  <FaEdit size={18} /> {t("categoryS.edit_category")}</>
                            : <>  <BiSave size={18} /> {t("categoryS.add_category")}</>
                          }
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={ClearAll}
                      className="mb-3 flex items-center justify-between rounded-md  bg-red-600 px-4 py-2 text-white hover:bg-red-950"
                    >
                      <FaBan size={18} /> {t("home.cancel_item")}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div className="w-full lg:w-9/12 ">
          <div className="w-full rounded-md bg-[#ffffff] p-4 shadow-md">
            <div className="mb-4 flex items-center gap-2">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={
                  t("categoryS.search_placeholder") || "Search accounts..."
                }
                className="rounded border px-3 py-2 text-sm"
              />
            </div>

            <div
              className="relative overflow-x-auto"
              dir={isRTL ? "rtl" : "ltr"}
            >
              <table
                className={`w-full justify-start text-sm ${
                  isRTL ? "text-right" : "text-left"
                }  text-[#d0d2d6]`}
              >
                <thead className="border-b  border-[#dcdada] bg-[#EEF2F7] text-sm uppercase text-[#595b5d]">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      {t("dashboardS.no")}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {t("categoryS.account_id")}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {t("categoryS.name")}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {t("categoryS.phone")}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {t("categoryS.address")}
                    </th>
                    <th scope="col" className="justify-end  px-4 py-3">
                      {t("dashboardS.action")}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {accounts?.map((d, i) => (
                    <tr
                      key={i}
                      className=" border-b border-[#dcdada] text-base text-[#595b5d]"
                    >
                      <td className="whitespace-nowrap px-4  py-1">{i + 1}</td>
                      <td className="whitespace-nowrap px-4 py-1">
                        {d.accountId}
                      </td>
                      <td className="whitespace-nowrap px-4 py-1">{d.name}</td>
                      <td className="whitespace-nowrap px-4 py-1">{d.phone}</td>
                      <td className="whitespace-nowrap px-4 py-1">
                        {d.address}
                      </td>
                      <td className="whitespace-nowrap px-4 py-1 font-medium">
                        <div className="flex items-center justify-center gap-2 text-[#d0d2d6]">
                          <div
                            onClick={() => {
                              setState({
                                accountId: d.accountId,
                                name: d.name,
                                phone: d.phone,
                                address: d.address,
                                accountTypeId: d.accountTypeId,
                              });
                              setState((prevState) => ({
                                ...prevState,
                                name: d.name,
                                phone: d.phone,
                                address: d.address,
                                accountTypeId: d.accountTypeId,
                              }));

                              setAccountIdEdit(d.accountId);
                              // setAccountName(d.name);
                              setAddEdit(true);
                              setShow(true);
                            }}
                            className="cursor-pointer rounded bg-darkBlue p-[6px] text-[#e8ebed] hover:shadow-lg hover:shadow-[#2a629aab]"
                          >
                            {" "}
                            <FaEdit />{" "}
                          </div>
                          {/* <div
                            onClick={() => handleDeleteCategory(d.accountId)}
                            className="cursor-pointer rounded bg-red-500 p-[6px] text-[#e8ebed] hover:shadow-lg hover:shadow-red-500/50"
                          >
                            {" "}
                            <FaTrash />{" "}
                          </div> */}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalAccounts <= parPage ? null : (
              <div className="bottom-4 right-4 mt-4 flex w-full justify-end">
                <Pagination
                  pageNumber={currentPage}
                  setPageNumber={setCurrentPage}
                  totalItem={totalAccounts}
                  parPage={parPage}
                  showItem={Math.floor(totalAccounts / parPage + 2)}
                />
              </div>
            )}

            {/* 
            <div className="bottom-4 right-4 mt-4 flex w-full justify-end">
              {accounts.length > parPage && (
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="rounded bg-blue-500 px-4 py-2 text-white"
                >
                  Next Page
                </button>
              )}
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Accounts;
