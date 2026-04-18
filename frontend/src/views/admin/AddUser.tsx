import { backend_url_img } from "@/api/server";
import useInputFocusManager from "@/hooks/useInputFocusManager";
import Modal from "@/layout/Modal";
import { useAppDispatch } from "@/store/hooks";
import {
  createAdmin,
  deleteAdmin,
  getAllAdmins,
  messageClear,
  updateAdmin,
  updateAdminPassword,
} from "@/store/Reducers/authReducer";
import { getCurrentTime } from "@/utils/timeConvertor";
import moment from "moment";
import React, { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  FaEdit,
  FaImage,
  FaRegEye,
  FaRegEyeSlash,
  FaTrash,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { PropagateLoader } from "react-spinners";
import defaultImage from "../../assets/userDefault.png";
import { overrideStyle } from "../../utils/utils";
import Pagination from "../Pagination";

// --- Types ---
interface AdminUser {
  id: number;
  name: string;
  phone: string;
  role: string;
  image: string;
  password?: string;
}

interface AuthState {
  loader: boolean;
  successMessage: string | null;
  errorMessage: string | null;
  adminUsers: AdminUser[];
  totalAdmins: number;
  adminUser: AdminUser | null;
}

interface RootState {
  auth: AuthState;
}

interface FormState {
  name: string;
  phone: string;
  password: string;
  newPassword: string;
  role: string;
  image: File | string | null;
  createAt: Date | string;
}

const adminRole = ["admin", "superadmin", "manager", "editor"] as const;

const AddUser: React.FC = () => {
const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation();

  const submitButtonRef = useRef<HTMLButtonElement>(null);
          const nextInputRef = useRef<HTMLInputElement>(null);
          
          
          const { 
          registerRef, 
          getKeyDownHandler, 
          getChangeHandler,
          focusNext 
        } = useInputFocusManager(4, {
          buttonRef: submitButtonRef,
          autoFocusOnChange: true,
          textareaNavigation: 'ctrl-enter', 
        });

  const currentLanguage = i18n.language;
  const isRTL = currentLanguage === "ar" || currentLanguage === "kr";

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchValue, setSearchValue] = useState<string>("");
  const [parPage, setParPage] = useState<number>(5);
  const [userId, setUserId] = useState<number | null>(0);
  const [imageShow, setImage] = useState<string>("");
  const [roleShow, setRoleShow] = useState<boolean>(false);
  const [addEdit, setAddEdit] = useState<boolean>(false);
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [state, setState] = useState<FormState>({
    name: "",
    phone: "",
    password: "",
    newPassword: "",
    role: "",
    image: null,
    createAt: getCurrentTime(),
  });

  const {
    loader,
    successMessage,
    errorMessage,
    adminUsers,
    totalAdmins,
    adminUser,
  } = useSelector((state: RootState) => state.auth);



  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  useEffect(() => {
    const obj = {
      parPage,
      page: currentPage,
      searchValue,
    };
    dispatch(getAllAdmins(obj));
    
    setSearchValue("")
  }, [searchValue, currentPage, parPage, adminUser, dispatch]);

  const inputHandle = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setState({
      ...state,
      [e.target.name]: e.target.value,
    });
  };

  const imageHandle = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      setImage(URL.createObjectURL(file));
      setState({
        ...state,
        image: file,
      });
    }
  };

  // const imageHandle = (files: FileList | null) => {
  //   if (files && files.length > 0) {
  //     const file = files[0];
  //     setImage(URL.createObjectURL(file));
  //     setState({
  //       ...state,
  //       image: file,
  //     });
  //   }
  // };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const createdAt = getCurrentTime();

    const formData = new FormData();
    formData.append("name", state.name);
    formData.append("phone", state.phone);
    formData.append("password", state.password);
    formData.append("role", state.role);
    formData.append(
      "createdAt",
      moment(createdAt).format("YYYY-MM-DD HH:mm:ssZ"),
    );

    if (state.image instanceof File) {
      formData.append("image", state.image);
    } else {
      const response = await fetch(defaultImage);
      const blob = await response.blob();
      formData.append("image", blob, "defaultImage.png");
    }

    if (userId) {
      dispatch(updateAdmin({ userId: Number(userId), formData }));
    } else {
      dispatch(createAdmin(formData));
    }
    setAddEdit(false);
  };

  //   const add_image = (file: File | undefined) => {
  //     if (userId && file) {
  //       dispatch(admin_image_upload({ image: file, userId }));
  //       dispatch(messageClear());
  //     }
  //   };

  const updatePassword = () => {
    // e.preventDefault();
    if (userId !== 0 && userId !== null) {
      dispatch(
        updateAdminPassword({
          userId: userId,
          password: state.password,
          newPassword: state.newPassword,
        }),
      );
      setModalOpen(false);
    }
  };
  const handleDeleteAdmin = (userId: number) => {
    const adminToDelete = adminUsers.find((p) => Number(p.id) === userId);

    if (!adminToDelete) {
      toast.error("Contract not found");
      return;
    }

    if (window.confirm(t("currencyS.delete_confirm") || "Are you sure?")) {
      dispatch(
        deleteAdmin({
          userId,
          deleteAdmin: { ...adminToDelete, id: Number(adminToDelete.id) },
        }),
      );
    }
  };

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
      const obj = { parPage, page: currentPage, searchValue };
      dispatch(getAllAdmins(obj));

      setState({
        name: "",
        phone: "",
        password: "",
        role: "",
        newPassword: "",
        image: null,
        createAt: getCurrentTime(),
      });
      setImage("");
      setUserId(0);
      setAddEdit(false);
    }
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
    }
  }, [successMessage, errorMessage]);

  return (
    <div className="px-2 pb-5 lg:px-4">
      <div className="grid w-full grid-cols-1 gap-7 pb-3 px-3 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
        <h2 className="text-md font-medium text-[#5c5a5a]">
          {" "}
          {t("userS.add_user")}
        </h2>
      </div>
      <div className="w-full rounded-md bg-[#ffffff] p-4 shadow-md">
        <div>
          <form onSubmit={submit}>
            <div className="grid grid-cols-1 gap-1 lg:grid-cols-2">
              <div className="rounded-xl bg-white p-4">
                {/* Grid: 2 rows × 2 columns */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Row 1 */}
                  <div className="flex w-full flex-col gap-1">
                    <label htmlFor="name">{t("userS.user_name")}</label>
                    <input
                     ref={registerRef(0)}
                      onChange={inputHandle}
                      value={state.name || ""}
                      className="rounded-md border border-[#bcb9b9] bg-[#ffffff] px-3 py-2 text-[#000000] outline-none focus:border-[#969494]"
                      type="text"
                      name="name"
                      // placeholder="Name"
                      id="name"
                      autoComplete="name"
                      onKeyDown={getKeyDownHandler(0)} 
                      required
                    />
                  </div>
                  <div className="flex w-full flex-col gap-1">
                    <label htmlFor="phone">{t("addShopS.phone")}</label>
                    <input
                     ref={registerRef(1)}
                      className="rounded-md border border-[#bcb9b9] bg-[#ffffff] px-3 py-2 text-[#000000] outline-none focus:border-[#969494]"
                      onChange={inputHandle}
                      value={state.phone || ""}
                      type="text"
                      name="phone"
                      id="phone"
                      autoComplete="tel"
                       onKeyDown={getKeyDownHandler(1)} 
                      required
                      // placeholder="Phone"
                    />
                  </div>

                  {/* Row 2 */}
                  <div className="relative flex w-full flex-col justify-start gap-1">
                    <label htmlFor="password">{t("addShopS.password")}</label>
                    <input
                     ref={registerRef(2)}
                      onChange={inputHandle}
                      value={state.password || ""}
                      className="rounded-md border border-[#bcb9b9] bg-[#ffffff] px-3 py-2 text-[#000000] outline-none focus:border-[#969494]"
                      type="password"
                      name="password"
                      // placeholder="Password"
                      id="password"
                          onKeyDown={getKeyDownHandler(2)}
                      required
                      // disabled={addEdit ? true : false}
                    />
                  </div>
                  <div className="relative flex w-full flex-col  justify-start gap-1">
                    <label htmlFor="role">{t("userS.admin_role")}</label>

                    <select
                     ref={registerRef(3)}
                      onChange={(e) => {
                        setRoleShow(false);
                        setState({ ...state, role: e.target.value });
                      }}
                      id="role"
                      name="role"
                      value={state.role} // ✅ this controls which one is selected
                      className="rounded-md border border-slate-400 bg-[#ffffff] px-3 py-[6px] text-sm font-medium text-[#000000] focus:border-secondary"
                      required
                      onKeyDown={getKeyDownHandler(3)}
                    >
                      <option value="">{t("currencyS.select_currency")}</option>
                      {adminRole?.map((admin) => (
                        <option
                          key={admin}
                          value={admin} // ✅ each option has its own value
                          className="max-w-2/4 truncate text-right"
                          style={{ direction: "rtl" }}
                        >
                          {admin}
                        </option>
                      ))}
                    </select>

                    <div
                      className={`absolute top-[101%] z-[9999] w-full rounded-md border border-gray-500 bg-[#e8ebed] transition-all ${
                        roleShow ? "scale-100" : "scale-0"
                      } `}
                    >
                      <div className="pt-3"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-white p-4">
                <div className="flex items-center justify-start py-3">
                  <label
                    className="flex h-[150px] w-[150px] cursor-pointer flex-col items-center justify-center border border-dashed border-primary hover:border-red-500 "
                    htmlFor="image"
                  >
                    {imageShow ? (
                      <img className="h-full w-full" src={imageShow} alt="" />
                    ) : (
                      <>
                        <span>
                          <FaImage />{" "}
                        </span>
                        <span>{t("userS.user_image")}</span>
                      </>
                    )}
                  </label>
                  <input
                    onChange={(e) => {
                      imageHandle(e.target.files);
                      // add_image(e)
                    }}
                    className="hidden"
                    type="file"
                    name="image"
                    id="image"
                  />
                </div>
              </div>
            </div>

            <div className="flex w-full  flex-col sm:w-full md:w-full md:flex-row">
              <button
                  ref={submitButtonRef}
                disabled={loader ? true : false}
                className="w-[200px] rounded-md bg-[#319368] px-2  py-2 text-base font-normal text-white hover:bg-primary hover:shadow-lg"
              >
                {loader ? (
                  <PropagateLoader color="#fff" cssOverride={overrideStyle} />
                ) : (
                  <>{addEdit ? t("userS.edit_user") : t("userS.add_user")}</>
                )}
              </button>
            </div>
          </form>
          <div className="flex w-full  flex-col p-1 sm:w-full md:w-full md:flex-row">
            <button
              onClick={() => setModalOpen(true)}
              disabled={userId === 0} // Disable only if no userId
              className={`mt-1 w-[200px] rounded-md px-2 py-2 text-base font-normal text-white hover:bg-primary hover:shadow-lg
    ${userId === 0 ? "cursor-not-allowed bg-gray-400" : "bg-[#2A629A]"}`}
            >
              {t("userS.edit_password")}
            </button>
          </div>
        </div>

        <Modal
          isOpen={isModalOpen}
          width={"lg"}
          onClose={() => setModalOpen(false)}
        >
          <h2 className="text-md mb-4 font-semibold">
            {t("userS.edit_password")}
          </h2>

          <div className="flex w-full flex-col justify-start">
            <div className="relative mb-3 flex w-full flex-col justify-start gap-1">
              <label className="py-1" htmlFor="password">
                {t("userS.old_password")}
              </label>
              <input
                onChange={inputHandle}
                value={state.password || ""}
                className="rounded-md border border-[#bcb9b9] bg-[#ffffff] px-3 py-2 text-[#000000] outline-none focus:border-[#969494]"
                type="password"
                name="password"
                // placeholder="Password"
                id="password"
                required
                // disabled={addEdit ? true : false}
              />
            </div>
            <label className="py-2" htmlFor="newPassword">
              {t("userS.edit_password")}
            </label>
            <div className="relative flex w-full flex-col items-center justify-center">
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className={`absolute ${
                  isRTL ? "left-3" : "right-3"
                } text-gray-500 hover:text-gray-800`}
              >
                {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
              </button>
              <input
                onChange={inputHandle}
                value={state.newPassword || ""}
                className="w-full rounded-md border border-[#bcb9b9] bg-[#ffffff] px-3 py-2 text-[#000000] outline-none focus:border-[#969494]"
                type={showPassword ? "text" : "password"}
                name="newPassword"
                id="newPassword"
                required
              />
            </div>
            <button
              onClick={updatePassword}
              disabled={loader ? true : false}
              className="mt-3 w-[200px] rounded-md bg-[#2A629A] px-2  py-2 text-base font-normal text-white hover:bg-primary hover:shadow-lg"
            >
              {t("userS.edit_password")}
            </button>
          </div>
        </Modal>
      </div>
      <div className="mt-4 w-full rounded-md bg-[#ffffff] p-4 shadow-md">
        <div className="mt-1 flex items-center justify-between pb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-md text-[#5c5a5a]">
              {t("dashboardS.display")}
            </h2>
            <select
              onChange={(e) => setParPage(parseInt(e.target.value))}
              id="option"
              className="rounded-md border border-[#bcb9b9] bg-[#F9FBFE] px-4 py-1 text-[#5c5a5a] outline-none focus:border-[#bcb9b9]"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="50">50</option>
            </select>
          </div>
          <div className="flex items-center gap-3"></div>
        </div>
        <div className="relative overflow-x-auto " dir={isRTL ? "rtl" : "ltr"}>
          <table
            className={`w-full text-sm ${
              isRTL ? "text-right" : "text-left"
            }  text-[#d0d2d6]`}
          >
            <thead className="border-b border-[#dcdada] bg-[#EEF2F7] text-sm uppercase text-[#5c5a5a]">
              <tr>
                <th scope="col" className="px-4 py-2">
                  {t("dashboardS.no")}
                </th>

                <th scope="col" className="px-4 py-2">
                  {t("userS.user_name")}
                </th>
                <th scope="col" className="px-4 py-2">
                  {t("categoryS.image")}
                </th>
                <th scope="col" className="px-4 py-2">
                  {t("addShopS.phone")}
                </th>
                <th scope="col" className="px-4 py-2">
                  {t("addShopS.role")}
                </th>

                <th
                  scope="col"
                  className="flex items-center justify-end px-4 py-3"
                >
                  {t("dashboardS.action")}
                </th>
              </tr>
            </thead>

            <tbody>
              {adminUsers?.map((d, i) => (
                <tr
                  key={i}
                  className="border-b border-[#dcdada] text-lg  text-[#595b5d]"
                >
                  <td className="whitespace-nowrap px-4  py-2">{i + 1}</td>

                  <td className="whitespace-nowrap px-4 py-1">{d.name} </td>
                  <td className="whitespace-nowrap px-4  py-2">
                    <img
                      className="h-[36px] w-[36px]"
                      src={`${backend_url_img}${d.image}`}
                      alt=""
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-1">{d.phone}</td>
                  <td className="whitespace-nowrap px-4 py-1">{d.role} </td>
                  <td className="whitespace-nowrap px-4  py-1">
                    <div className="flex items-center justify-end gap-4">
                      <div
                        onClick={() => {
                          setState({
                            name: d.name,
                            phone: d.phone,
                            role: d.role,
                            password: d.password ?? "",
                            newPassword: "",
                            image: null,
                            createAt: getCurrentTime(),
                          });
                          setImage(`${backend_url_img}${d.image}`);
                          setUserId(d.id);
                          setAddEdit(true);
                        }}
                        className={`rounded bg-green-600 px-[8px] py-[8px] text-sm text-white hover:shadow-lg hover:shadow-[#2a629aab]`}
                      >
                        {" "}
                        <FaEdit />{" "}
                      </div>
                      <div
                        onClick={() => {
                          handleDeleteAdmin(d.id);
                        }}
                        className="rounded bg-red-500 px-[6px] py-[6px] text-[#e8ebed] hover:shadow-lg hover:shadow-red-500/50"
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
      </div>
      {totalAdmins <= parPage ? null : (
        <div className="bottom-4 right-4 mt-4 flex w-full justify-end">
          <Pagination
            pageNumber={currentPage}
            setPageNumber={setCurrentPage}
            totalItem={totalAdmins}
            parPage={parPage}
            showItem={Math.floor(totalAdmins / parPage + 2)}
          />
        </div>
      )}
    </div>
  );
};

export default AddUser;
