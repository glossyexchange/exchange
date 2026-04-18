import React, { FormEvent, useEffect, useRef, useState } from "react";

import { FaEdit, FaTrash } from "react-icons/fa";
import { IoMdCloseCircle } from "react-icons/io";
import { PropagateLoader } from "react-spinners";

import useInputFocusManager from "@/hooks/useInputFocusManager";
import { useAppDispatch } from "@/store/hooks";
import { RootState } from "@/store/rootReducers";
import { overrideStyle } from "@/utils/utils";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import {
  createAccountType,
  deleteAccountType,
  getAllAccountTypes,
  messageClear,
  updateAccountType,
} from "../../store/Reducers/accountTypeReducer";


interface FormState {
   type: string;
  // start: number;
  // end: number;
}

const AccountType: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const isRTL = currentLanguage === "ar" || currentLanguage === "kr";
 const dispatch = useAppDispatch();

 const submitButtonRef = useRef<HTMLButtonElement>(null);
  
  // Use your custom hook - define the number of inputs in sequence
  const { registerRef, getKeyDownHandler } = useInputFocusManager(1, {
    buttonRef: submitButtonRef,
    onLastInputEnter: () => {
      // Optional: If you want to submit form on last input Enter
      // if (!loader) {
      //   const form = document.querySelector('form');
      //   if (form) {
      //     const submitEvent = new Event('submit', { cancelable: true });
      //     form.dispatchEvent(submitEvent);
      //   }
      // }
    }
  });

  const { loader, successMessage, errorMessage, accountTypes } =
    useSelector((state: RootState) => state.accountType);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchValue, setSearchValue] = useState<string>("");
  const [parPage, setParPage] = useState<number>(15);
  const [show, setShow] = useState<boolean>(false);
  // const [imageShow, setImage] = useState<string>("");
  const [accountIdEdit, setAccountIdEdit] = useState<number>(0);
  // const [accountName, setAccountName] = useState<string>("");

  const [addEdit, setAddEdit] = useState<boolean>(false);



  const [state, setState] = useState<FormState>({
    type: "",
    // start: 0,
    // end: 0,
  });

   

  const add_account_type = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const info = {
      type: state.type,
      // start: state.start,
      // end: state.end,
    };

    if (accountIdEdit) {
      dispatch(
        updateAccountType({
          id:Number(accountIdEdit),
          info,
        }),
      );
    } else {
      
      dispatch(createAccountType(info));
    }
  };

  const handleDeleteCategory = (id: number) => {
    if (window.confirm(t('currencyS.delete_confirm') || 'Are you sure?')) {
      dispatch(deleteAccountType({ id:id}));
    }
  };

  const ClearAll = () => {
    setState({
    type: "",
    // start: 0,
    // end: 0,
    });
    // setImage("");

    setAccountIdEdit(0);
    // setAccountName("");
    setAddEdit(false);
  };

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
      const obj = {
        parPage: parseInt(parPage.toString()),
        page: parseInt(currentPage.toString()),
        searchValue,
      };
      dispatch(getAllAccountTypes(obj));
      ClearAll();
    }
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
    }
  }, [successMessage, errorMessage]);

  useEffect(() => {
    setCurrentPage(1)
    setParPage(15)
    setSearchValue("")
    const obj = {
      parPage: parseInt(parPage.toString()),
      page: parseInt(currentPage.toString()),
      searchValue,
    };
    dispatch(getAllAccountTypes(obj));
  }, [searchValue, currentPage, parPage]);

  return (
    <div className="px-2 pb-5 lg:px-4">
      <div className="grid w-full grid-cols-1 gap-7 pb-3 pl-3 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
        <h2 className="text-lg font-medium text-[#5c5a5a]">
          {t("categoryS.category_types")}
        </h2>
      </div>
      <div className="mb-5 flex items-center justify-between rounded-md bg-[#ffffff] p-4 shadow-md lg:hidden">
        <h1 className="text-lg font-semibold text-[#5c5a5a]">
          {t("categoryS.category_types")}
        </h1>
        <button
          onClick={() => setShow(true)}
          className="cursor-pointer rounded-sm bg-[#2ba460] px-4 py-2 text-sm text-white shadow-lg hover:shadow-[#304539]"
        >
          {t("categoryS.add_category_types")}
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
                  {t("categoryS.add_category_types")}
                </h1>

                <div onClick={() => setShow(false)} className="block lg:hidden">
                  <IoMdCloseCircle size={34} />
                </div>
              </div>

              
              <form onSubmit={add_account_type}>
                
                <div className="mb-3 flex w-full flex-col gap-1">
                  <label htmlFor="type"> {t("categoryS.name")}</label>
                  <input
                    value={state.type}
                    onChange={(e) => {
                      setState({ ...state, type: e.target.value });
                    }}
                   ref={registerRef(0)}
        onKeyDown={getKeyDownHandler(0)}
                    required
                    className="rounded-md border border-[#bcb9b9] bg-[#ffffff] px-4 py-2 text-[#000000] outline-none focus:border-[#969494]"
                    type="text"
                    id="type"
                    name="type"
                    // disabled={addEdit? true: false}
                    // placeholder={t('categoryS.ku_name')}
                  />
                </div>
                {/* <div className="mb-3 flex w-full flex-col gap-1">
                  <label htmlFor="start">
                    {" "}
                    {t("categoryS.account_id")}
                  </label>
                  <input
                    value={state.start}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setState({ ...state, start: value });
                    }}
                     ref={registerRef(1)}
        onKeyDown={getKeyDownHandler(1)}
                    required
                    className="rounded-md border border-[#bcb9b9] bg-[#ffffff] px-4 py-2 text-[#000000] outline-none focus:border-[#969494]"
                    type="number"
                    id="start"
                    name="start"
                 
                  />
                </div>
                <div className="mb-3 flex w-full flex-col gap-1">
                  <label htmlFor="end">
                    {" "}
                    {t("categoryS.account_id")}
                  </label>
                  <input
                    value={state.end}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setState({ ...state, end: value });
                    }}
                     ref={registerRef(2)}
        onKeyDown={getKeyDownHandler(2)}
                    required
                    className="rounded-md border border-[#bcb9b9] bg-[#ffffff] px-4 py-2 text-[#000000] outline-none focus:border-[#969494]"
                    type="number"
                    id="end"
                    name="end"

                  />
                </div> */}
                
                
                <div>
                  

                  <div className="mt-4">
                    <button
                      disabled={loader ? true : false}
                      ref={submitButtonRef}

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
                            ? t("categoryS.edit_category_types")
                            : t("categoryS.add_category_types")}
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
                      {t("categoryS.account_id")}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {t("categoryS.select_accout_type")}
                    </th>
                    {/* <th scope="col" className="px-4 py-3">
                      {t("currencyS.from_no")}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {t("currencyS.to_no")}
                    </th> */}
                    <th scope="col" className="flex items-center justify-center  px-4 py-3">
                      {t("dashboardS.action")}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {accountTypes?.map((d, i) => (
                    <tr
                      key={i}
                      className=" border-b border-[#dcdada] text-base text-[#595b5d]"
                    >
                      <td className="whitespace-nowrap px-4  py-1">{i + 1}</td>
                      <td className="whitespace-nowrap px-4 py-1">
                        {d.id}
                      </td>
                      <td className="whitespace-nowrap px-4 py-1">{d.type}</td>
                      {/* <td className="whitespace-nowrap px-4 py-1">{d.start}</td>
                      <td className="whitespace-nowrap px-4 py-1">
                        {d.end}
                      </td> */}
                      <td className="whitespace-nowrap px-4 py-1 font-medium">
                        <div className="flex items-center justify-center gap-2 text-[#d0d2d6]">
                          <div
                            onClick={() => {
                              setState({
                               
                                type: d.type,
                                // start: d.start,
                                // end: d.end,
                              });
                              setState((prevState) => ({
                                ...prevState,
                               type: d.type,
                                // start: d.start,
                                // end: d.end,
                              }));

                              setAccountIdEdit(Number(d.id));
                              // setAccountName(d.type);
                              setAddEdit(true);
                              setShow(true);
                            }}
                            className="cursor-pointer rounded bg-darkBlue p-[6px] text-[#e8ebed] hover:shadow-lg hover:shadow-[#2a629aab]"
                          >
                            {" "}
                            <FaEdit />{" "}
                          </div>
                          <div
                            onClick={() => handleDeleteCategory(d.id)}
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

export default AccountType;
