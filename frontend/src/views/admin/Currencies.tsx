import React, { FormEvent, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FaEdit, FaTrash } from "react-icons/fa";
import { IoMdCloseCircle } from "react-icons/io";
import { useSelector } from "react-redux";
import { PropagateLoader } from "react-spinners";

import useInputFocusManager from "@/hooks/useInputFocusManager";
import {
  createCurrency,
  deleteCurrency,
  getAllCurrencies,
  messageClear,
  updateCurrency,
} from "@/store/Reducers/currencyReducer";
import { useAppDispatch } from "@/store/hooks";
import { RootState } from "@/store/rootReducers";
import {
  CurrencyCreateState,
} from "@/types/currencyTypes";
import { overrideStyle } from "@/utils/utils";

const currencyActionTypes = [
  { id: 1, type: "جاران", action:"MULTIPLY" },
  { id: 2, type: "دابەش" , action:"DIVIDE"},
];

const Currencies: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const isRTL = currentLanguage === "ar" || currentLanguage === "kr";
 const dispatch = useAppDispatch();

 const submitButtonRef = useRef<HTMLButtonElement>(null);
           const nextInputRef = useRef<HTMLInputElement>(null);
           
           
           const { 
           registerRef, 
           getKeyDownHandler, 
           getChangeHandler,
           focusNext 
         } = useInputFocusManager(5, {
           buttonRef: submitButtonRef,
           autoFocusOnChange: true,
           textareaNavigation: 'ctrl-enter', 
         });

  const { loader, successMessage, errorMessage, currencies } =
    useSelector((state: RootState) => state.currency);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchValue, setSearchValue] = useState<string>("");
  const [parPage, setParPage] = useState<number>(15);
  const [show, setShow] = useState<boolean>(false);
  const [currencyIdEdit, setCurrencyIdEdit] = useState<number>(0);

  const [addEdit, setAddEdit] = useState<boolean>(false);

  const [state, setState] = useState<CurrencyCreateState>({
    currencyId: 0,
    currencySymbol:"",
    currency: "",
    CurrencyPrice:0,
    currencyAction:"",
  });

  const add_currency = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const info = {
      currencyId: state.currencyId,
      currencySymbol:state.currencySymbol,
      currency: state.currency,
      CurrencyPrice:state.CurrencyPrice,
      currencyAction:state.currencyAction,
    };

    if (currencyIdEdit) {
      dispatch(
        updateCurrency({
          id: Number(currencyIdEdit),
          info,
        }),
      );
    } else {
      dispatch(createCurrency(info));
    }
  };

 const handleDeleteCurrency = (id: number) => {
  const currencyToDelete = currencies.find(c => c.id === id);
  
  if (!currencyToDelete) {
    toast.error("Currency not found");
    return;
  }

  if (window.confirm(t("currencyS.delete_confirm") || "Are you sure?")) {
    dispatch(deleteCurrency({ 
      id,
      deletedCurrency: currencyToDelete
    }));
  }
};
  const ClearAll = () => {
    setState({
      currencyId: 0,
    currencySymbol:"",
    currency: "",
    CurrencyPrice:0,
    currencyAction:"",
    });
    setCurrencyIdEdit(0);
    setAddEdit(false);
  };

   

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
      setCurrentPage(1)
    setParPage(15)
    setSearchValue("")
      const obj = { parPage, page: currentPage, searchValue };
      dispatch(getAllCurrencies(obj));
      ClearAll();
    }
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
    }
  }, [successMessage, errorMessage]);

  useEffect(() => {
    
    const timeoutId = setTimeout(() => {
      const obj = { parPage, page: currentPage, searchValue };
      dispatch(getAllCurrencies(obj));
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchValue, currentPage, parPage]);

  return (
    <div className="px-3 pb-5 lg:px-3">
      <div className="grid w-full grid-cols-1 gap-7 pb-3 px-3 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
        <h2 className="text-md font-medium text-[#5c5a5a]">
          {t("currencyS.currencies")}
        </h2>
      </div>
      <div className="mb-5 flex items-center justify-between rounded-md bg-[#ffffff] p-4 shadow-md lg:hidden">
        <h1 className="text-lg font-semibold text-[#5c5a5a]">
          {t("currencyS.currencies")}
        </h1>
        <button
          onClick={() => setShow(true)}
          className="cursor-pointer rounded-sm bg-[#2ba460] px-4 py-2 text-sm text-white shadow-lg hover:shadow-[#304539]"
        >
          {t("currencyS.add_currency")}
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
                  {t("currencyS.add_currency")}
                </h1>

                <div onClick={() => setShow(false)} className="block lg:hidden">
                  <IoMdCloseCircle size={34} />
                </div>
              </div>

              <form onSubmit={add_currency}>
                <div className="mb-3 flex w-full flex-col gap-1">
                  <label htmlFor="type"> {t("currencyS.currency_id")}</label>
                  <input
                   ref={registerRef(0)}
                    value={state.currencyId}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setState({ ...state, currencyId: value });
                    }}
                    required
                    onKeyDown={getKeyDownHandler(0)} 
                    className="rounded-md border border-[#bcb9b9] bg-[#ffffff] px-4 py-2 text-[#000000] outline-none focus:border-[#969494]"
                    type="number"
                    id="type"
                    name="type"
                    // disabled={currencyIdEdit!==0? true: false}
                    // placeholder={t('categoryS.ku_name')}
                  />
                </div>
                <div className="mb-3 flex w-full flex-col gap-1">
                  <label htmlFor="start"> {t("currencyS.currency_name")}</label>
                  <input
                  ref={registerRef(1)}
                    value={state.currency}
                    onChange={(e) => {
                      setState({ ...state, currency: e.target.value });
                    }}
                    required
                    onKeyDown={getKeyDownHandler(1)} 
                    className="rounded-md border border-[#bcb9b9] bg-[#ffffff] px-4 py-2 text-[#000000] outline-none focus:border-[#969494]"
                    type="text"
                    id="start"
                    name="start"
                    // placeholder={t('categoryS.en_name')}
                  />
                </div>
                <div className="mb-3 flex w-full flex-col gap-1">
                  <label htmlFor="currency_symbol"> {t("currencyS.currency_symbol")}</label>
                  <input
                   ref={registerRef(2)}
                    value={state.currencySymbol}
                    onChange={(e) => {
                      setState({ ...state, currencySymbol: e.target.value });
                    }}
                    required
                    onKeyDown={getKeyDownHandler(2)}
                    className="rounded-md border border-[#bcb9b9] bg-[#ffffff] px-4 py-2 text-[#000000] outline-none focus:border-[#969494]"
                    type="text"
                    id="currency_symbol"
                    name="currency_symbol"
                    // placeholder={t('categoryS.en_name')}
                  />
                </div>
<div className="mb-3 flex w-full flex-col gap-1">
                  <label htmlFor="price"> {t("currencyS.currency_price")}</label>
                  <input
                     ref={registerRef(3)}
                    value={state.CurrencyPrice}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setState({ ...state, CurrencyPrice: value });
                    }}
                    required
                    onKeyDown={getKeyDownHandler(3)}
                    className="rounded-md border border-[#bcb9b9] bg-[#ffffff] px-4 py-2 text-[#000000] outline-none focus:border-[#969494]"
                    type="number"
                    id="price"
                    name="price"
                    // disabled={currencyIdEdit!==0? true: false}
                    // placeholder={t('categoryS.ku_name')}
                  />
                </div>
                <div className="mb-3 flex w-full flex-col gap-1">
      <label htmlFor="exchangeTypeId">
         {t("currencyS.currency_action")}
      </label>
      <select

       ref={registerRef(4)}
        value={state.currencyAction}
        onChange={(e) => {
                 setState({ ...state, currencyAction: e.target.value });
                 setTimeout(() => {
    const nextInput = document.querySelector('[data-next-button]') as HTMLElement;
    if (nextInput) nextInput.focus();
  }, 10);
                  }}
        id="exchangeTypeId"
        className="w-1/2 rounded-md border border-slate-400 bg-[#ffffff] px-2 py-1 text-sm font-medium text-[#000000] focus:border-secondary lg:w-full"
        required
         onKeyDown={getKeyDownHandler(4)}
      >
        <option value=""> {t("currencyS.select_currency_action")}</option>
        {currencyActionTypes?.map((type) => (
          <option key={type.id} value={type.action}>
            {type.type}
          </option>
        ))}
      </select>
    </div>
                <div>
                  {/* <label
                    className="flex h-[238px] w-full cursor-pointer flex-col items-center justify-center border border-dashed border-[#d0d2d6] hover:border-red-500"
                    htmlFor="image"
                  >
                    {imageShow ? (
                      <img className="h-full w-full" src={imageShow} alt="" />
                    ) : (
                      <>
                        <span>
                          <FaImage />{" "}
                        </span>
                        <span> {t("categoryS.select_image")}</span>
                      </>
                    )}
                  </label> */}

                  <div className="mt-4">
                    <button
                    // data-next-button
                    ref={submitButtonRef}
                      disabled={loader ? true : false}
                      className="mb-3 w-full rounded-md  bg-[#319368] px-7 py-2 text-white hover:bg-primary"
                    >
                      {loader ? (
                        <PropagateLoader
                          color="#fff"
                          cssOverride={overrideStyle}
                        />
                      ) : (
                        <>
                          {addEdit
                            ? t("currencyS.edit_currency")
                            : t("currencyS.add_currency")}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div className="w-full lg:w-9/12 ">
          <div className="w-full rounded-md bg-[#ffffff] p-4 shadow-md">
            {/* <Search
                 setParPage={setParPage}
                 setSearchValue={setSearchValue}
                 searchValue={searchValue}
               /> */}

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
                      {t("currencyS.currency_id")}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {t("currencyS.currency_name")}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {t("currencyS.currency_symbol")}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {t("currencyS.currency_price")}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {t("currencyS.currency_action")}
                    </th>

                    <th scope="col" className="flex items-center justify-center  px-4 py-3">
                      {t("dashboardS.action")}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {currencies?.map((d, i) => (
                    <tr
                      key={i}
                      className=" border-b border-[#dcdada] text-base text-[#595b5d]"
                    >
                      <td className="whitespace-nowrap px-4  py-1">{i + 1}</td>

                      <td className="whitespace-nowrap px-4 py-1">
                        {d.currencyId}
                      </td>
                      <td className="whitespace-nowrap px-4 py-1">
                        {d.currency}
                      </td>
                      <td className="whitespace-nowrap px-4 py-1">
                        {d.currencySymbol}
                      </td>
                      <td className="whitespace-nowrap px-4 py-1">
                        {d.CurrencyPrice}
                      </td>
                       <td className="whitespace-nowrap px-4 py-1">
                        {d.currencyAction}
                      </td>

                      <td className="whitespace-nowrap px-4 py-1 font-medium">
                        <div className="flex items-center justify-center gap-2 text-[#d0d2d6]">
                          <div
                            onClick={() => {
                              setState({
                                currencyId: d.currencyId,
                                currencySymbol:d.currencySymbol,
                                currency: d.currency,
                                CurrencyPrice:d.CurrencyPrice,
                                currencyAction:d.currencyAction,
                              });
                              //   setState((prevState) => ({
                              //     ...prevState,
                              //    currencyId: d.currencyId,
                              //     currency: d.currency,
                              //   }));

                              setCurrencyIdEdit(Number(d.id));
                              setAddEdit(true);
                              setShow(true);
                            }}
                            className="cursor-pointer rounded bg-darkBlue p-[6px] text-[#e8ebed] hover:shadow-lg hover:shadow-[#2a629aab]"
                          >
                            {" "}
                            <FaEdit />{" "}
                          </div>
                          <div
                            onClick={() => handleDeleteCurrency(d.id)}
                            className="cursor-pointer rounded bg-red-500 p-[6px] text-[#e8ebed] hover:shadow-lg hover:shadow-red-500/50"
                          >
                            {" "}
                            <FaTrash />{" "}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bottom-4 right-4 mt-4 flex w-full justify-end">
              {/* {accounts.length > parPage && (
                 <Pagination
                   pageNumber={currentPage}
                   setPageNumber={setCurrentPage}
                   totalItem={accounts.length}
                   parPage={parPage}
                   showItem={Math.floor((accounts.length / parPage)+2)}
                 />
                  )} */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Currencies;
