import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { getRequest, postRequest, BASE_URL } from "../utils/fetch-function";
import { v4 as uuidv4 } from "uuid";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { StellarServers } from "@sorobuild/stellar-sdk";

import { WalletKitService } from "../wallet-kit/services/global-service";

const StatesContext = createContext();

export function StatesProvider({ children }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [orders, setOrders] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [customerInvoices, setCustomerInvoices] = useState(null);
  const [isAddService, setIsAddService] = useState(false);
  const [isBulkUpload, setIsbulkUpload] = useState(false);
  const [walletKitIsOpen, setWalletKitIsOpen] = useState(false);
  const [loadedContractId, setLoadedContractId] = useState("");

  const [isEnabled, setIsEnabled] = useState(false);
  const [bulkUploadData, setBulkUploadData] = useState(null);
  const [paymentsData, setPaymentsData] = useState([]);
  const [contractOperations, setContractOperations] = useState(null);
  const [contractAddr, setContractAddr] = useState("");

  const [totalReceivables, setTotalReceivables] = useState({
    currency: "",
    total: 0,
  });

  const [allUsers, setAllUsers] = useState([]);
  const [userKey, setUserKey] = useState("");
  const [network, setNetwork] = useState("FUTURENET");
  const [connecting, setConnecting] = useState(false);

  const [enteredOtp, setEnteredOtp] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem("accessToken")
  );
  const [userProfile, setUserProfile] = useState(null);
  const [businessInfo, setBusinessInfo] = useState(null);

  const [path, setPath] = useState("");

  const [allClients, setAllClients] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [allServices, setAllServices] = useState(null);
  const [allItems, setAllItems] = useState([]);

  const [isFetching, setIsFetching] = useState(false);
  const [updateData, setUpdateData] = useState(0);
  const [items, setItems] = useState(null);
  const [productsAndServices, setProductsAndServices] = useState(null);

  const [isClient, setIsClient] = useState(true);
  const [countsData, setCountsData] = useState(null);
  const [refresh, setRefresh] = useState("");
  const [categories, setCategories] = useState([]);
  const [isAdministrator, setIsAdministrator] = useState(true);
  const [serviceToAddBody, setServiceToAddBody] = useState(null);
  const [tenant, setTenant] = useState("");
  const [expiryDate, setExpiryDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [onboardingAction, setOnboardingAction] = useState("currency");
  //options are: currency, logo and tap

  const [productCategoryTab, setProductCategoryTab] = useState("PRODUCT");

  const navigate = useNavigate();

  const { id } = useParams();

  const url = `https://rpc.ankr.com/stellar_soroban/8f847212cefcc391509e0aee929c173b83eaf25592bc7f122da333bddb851c79`;

  const key = "688a0cb12c5cded6ffb6016d_2396_688a0cf52c5cded6ffb60171";
  const serverUrl = {
    rpc: {
      testnet: "https://rpc.test",
      public: url,
    },
    horizon: {
      testnet: "https://horizon.test",
      public: "https://horizon.main",
    },
  };

  const stellarWalletKitOptions = WalletKitService.walletKit.modules;

  // console.log("the stellar wallet options", stellarWalletKitOptions);

  const { RpcServer, HorizonServer } = new StellarServers({
    serverUrl: serverUrl,
  });

  async function caller(network, hash) {
    try {
      const data = await RpcServer(network, "parsed").getTransaction(hash);

      console.log(data, { depth: null });

      // console.dir(data, { depth: null });
    } catch (err) {
      console.error("❌ Error while fetching transaction:", err);
    }
  }

  const capitalize = (str) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  const [predefinedServices, setPredefinedServices] = useState([]);
  const isLogin = !!accessToken;

  function formatDate(dateString) {
    // Create a Date object from the input string
    const date = new Date(dateString);

    // Extract components
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "short" }); // Short month name
    const year = date.getFullYear();

    // Return the formatted date
    return `${month} ${day}, ${year}`;
  }

  // console.log("the login profile", businessInfo);

  useEffect(() => {
    caller(
      "PUBLIC",
      "aeb44dea87558d9c29d31908919fbbf70618c7e12519141420c4629f32bb30df"
    );
  }, []);

  useEffect(() => {
    if (userProfile) {
      setIsClient(userProfile?.accountType !== "admin");
    }
  }, [userProfile]);

  useEffect(() => {
    // localStorage.removeItem("accessToken");
    // localStorage.removeItem("userProfile");
    // localStorage.removeItem("businessInfo");
    // localStorage.removeItem("expireAt");
    const dateNow = Date.now();

    if (Number(localStorage.getItem("expireAt") || 0) < dateNow) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userProfile");
      localStorage.removeItem("businessInfo");
      localStorage.removeItem("expireAt");
      setAccessToken(null);
      setUserProfile(null);
      setBusinessInfo(null);
      return;
    } else {
      const savedUser = JSON.parse(localStorage.getItem("userProfile")) || null;
      const businessDetails =
        JSON.parse(localStorage.getItem("businessInfo")) || null;

      setUserProfile(savedUser);
      setBusinessInfo(businessDetails);
      setAccessToken(localStorage.getItem("accessToken"));
    }
  }, [updateData]);

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const subdomain = url.hostname.split(".")[0];

      const tenant =
        subdomain === "" || subdomain === "www" || subdomain === "localhost"
          ? "administrator"
          : subdomain;

      setTenant(tenant);
    } catch (e) {
      console.log(e?.message);
    }
  });

  useEffect(() => {
    async function fetchClients() {
      try {
        setIsFetching(true);

        const res = await getRequest(
          "customer/all",
          "offset=1&limit=20",
          userProfile?.accessToken
        );

        if (res) {
          if (res?.customers.length > 0) {
            const total = res.customers.reduce((sum, customer) => {
              return sum + Number(customer.receivables);
            }, 0);
            setTotalReceivables((cur) => ({
              ...cur,
              total: total,
            }));
          }

          setAllClients(res);

          // setAllServices(res?.data?.data?.services);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
        throw error; // Re-throw for error handling upstream
      } finally {
        setIsFetching(false);
      }
    }
    if (
      userProfile?.accessToken &&
      !id &&
      userProfile?.accessToken &&
      userProfile?.loginType !== "MFA_REQUIRED"
    ) {
      fetchClients();
    }
  }, [updateData, userProfile?.accessToken, path]);

  // useEffect(() => {
  //   if (!id) {
  //     setSelectedClient(null);
  //   }
  // }, [path]);

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userProfile");
    localStorage.removeItem("businessInfo");
    setAccessToken("");
    setUserProfile(null);
    setBusinessInfo(null);
    if (userProfile?.accountType === "Customer") {
      navigate("/client");
    } else {
      navigate("/");
    }
  }

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await getRequest(
          "category/all",
          "offset=1&limit=20",
          accessToken
        );

        if (res) {
          // console.log("all fetched categories are", res);
          setCategories(res?.categories);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        throw error; // Re-throw for error handling upstream
      }
    }
    if (userProfile?.loginType !== "MFA_REQUIRED" && userProfile?.accessToken) {
      fetchCategories();
    }
  }, [productCategoryTab, updateData, userProfile?.accessToken]);

  // console.log("accessToken", accessToken, userProfile?.accessToken);

  useEffect(() => {
    async function fetchItems() {
      try {
        setIsFetching(true);

        const res = await getRequest(
          "offerings/all",
          "offset=1&limit=20",
          userProfile?.accessToken
        );

        if (res) {
          // console.log(res?.data?.data?.services);

          const internalServices = res?.offerings?.filter(
            (item) => item?.id === "685ca5011374a38da9cc5c1e"
          );

          setAllServices(internalServices);

          setProductsAndServices(res);

          setItems(res);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
        throw error; // Re-throw for error handling upstream
      } finally {
        setIsFetching(false);
      }
    }

    if (userProfile?.loginType !== "MFA_REQUIRED" && userProfile?.accessToken) {
      fetchItems();
    }
  }, [productCategoryTab, updateData, userProfile?.accessToken]);

  // console.log("user token", userProfile);
  let queryParams;
  useEffect(() => {
    async function getAllInvoice() {
      try {
        setIsFetching(true);
        // Make a POST request without the Authorization header
        // const response = await getRequest(
        //   "invoices/all",
        //   `offset=1&limit=20&draft=${"invoice" === "estimate"}`,
        //   userProfile?.accessToken
        // );

        if (userProfile?.id) {
          queryParams = `offset=1&limit=20&recipientId=${userProfile?.id}`;
        } else {
          queryParams = `offset=1&limit=20`;
        }

        if (queryParams) {
          const response = await getRequest(
            "invoices/all",
            queryParams,
            userProfile?.accessToken
          );

          setInvoices(response);

          const end = new Date(
            Date.now() - 1 * 24 * 60 * 60 * 1000
          ).toISOString();
          const start = new Date(Date.now()).toISOString();

          // const statement = await getRequest(
          //   "customer/statement",
          //   `startDate=${start}&endDate=${end}`,
          //   userProfile?.accessToken
          // );

          // console.log("the statement log is", statement);
        }
      } catch (err) {
        console.error(
          "Error creating invoice:",
          err.response ? err.response.data : err.message
        );
      } finally {
        setIsFetching(false);
      }
    }

    if (userProfile?.loginType !== "MFA_REQUIRED" && userProfile?.accessToken) {
      getAllInvoice();
    }
  }, [userProfile?.accessToken, updateData, userProfile?.id, queryParams]);

  useEffect(() => {
    async function getUsers() {
      try {
        setIsFetching(true);

        const response = await getRequest(
          "user/all",
          `offset=1&limit=20`,
          userProfile?.accessToken
        );

        // setInvoices(response);
        setAllUsers(response);
      } catch (err) {
        console.error(
          "Error creating invoice:",
          err.response ? err.response.data : err.message
        );
      } finally {
        setIsFetching(false);
      }
    }

    if (userProfile?.loginType !== "MFA_REQUIRED" && userProfile?.accessToken) {
      getUsers();
    }
  }, [userProfile?.accessToken, updateData]);

  //Route to onboarding

  // useEffect(() => {
  //   if (!userProfile?.accessToken) {
  //     // navigate("/");
  //   }

  //   if (businessInfo && userProfile?.accessToken?.length > 0) {
  //     if (!businessInfo?.currency) {
  //       navigate("/onboarding");
  //     }
  //   }
  // }, [businessInfo?.businessId, userProfile?.accessToken, updateData]);

  const triggerUpdate = () => {
    setUpdateData(uuidv4());
  };

  function formatUtcToLocalTime(utcString) {
    const date = new Date(utcString);

    const localHours = String(date.getHours()).padStart(2, "0");
    const localMinutes = String(date.getMinutes()).padStart(2, "0");

    const day = date.getDate();
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    return `${localHours}:${localMinutes}, ${month} ${day}, ${year}`;
  }

  function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);

    // Format hours and minutes
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    // Format day and month
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();

    // return `${hours}:${minutes}, ${day} ${month}, ${year}`;
    return `${hours}:${minutes}, ${day} ${month}, ${year}`;
  }

  function maskKey(key, start, end) {
    const prefix = key.slice(0, start); // 'sk_test_'
    const suffix = key.slice(-end); // last 4 characters
    const maskedLength = key.length - prefix.length - suffix.length;
    const masked = "*".repeat(maskedLength);
    return prefix + masked + suffix;
  }

  const downloadPayments = () => {
    const headers = [
      "NAME",
      "EMAIL",
      "PHONE",
      "AMOUNT",
      "PAYMENT METHOD",
      "STATUS",
    ];
    const rows = paymentsData.map((row) => [
      `${row?.customer?.first_name}  ${row?.customer?.last_name}`,
      row?.customer?.email,
      `${row?.customer?.phone?.country_code}-${row?.customer?.phone?.number}`,
      `${row?.order?.amount} ${row?.order?.currency}`,
      row?.paymentMethod,
      row?.status,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "dashboard-data.csv";
    link.click();
  };

  // console.log("business info is ", businessInfo);

  return (
    <StatesContext.Provider
      value={{
        email,
        setEmail,
        password,
        setPassword,
        accountType,
        setAccountType,
        BASE_URL,
        isLogin,
        isClient,
        enteredOtp,
        setEnteredOtp,
        otpToken,
        setOtpToken,
        accessToken,
        setAccessToken,
        userProfile,
        setUserProfile,
        selectedOrder,
        setSelectedOrder,
        selectedInvoice,
        setSelectedInvoice,
        handleLogout,
        orders,
        setOrders,
        formatDate,
        allClients,
        setAllClients,
        allServices,
        setAllServices,
        isFetching,
        setIsFetching,
        updateData,
        setUpdateData,
        invoices,
        setInvoices,
        countsData,
        setCountsData,
        refresh,
        setRefresh,
        items,
        setItems,
        categories,
        setCategories,
        isAdministrator,
        setIsAdministrator,
        postRequest,
        getRequest,
        tenant,
        userKey,
        setUserKey,
        setTenant,
        selectedClient,
        setSelectedClient,
        predefinedServices,
        setPredefinedServices,
        path,
        setPath,
        triggerUpdate,
        serviceToAddBody,
        setServiceToAddBody,
        toast,
        isAddService,
        setIsAddService,
        expiryDate,
        setExpiryDate,
        productCategoryTab,
        setProductCategoryTab,
        productsAndServices,
        setProductsAndServices,
        formatDateTime,
        capitalize,
        formatUtcToLocalTime,
        allUsers,
        setAllUsers,
        allItems,
        setAllItems,
        isBulkUpload,
        setIsbulkUpload,
        isEnabled,
        setIsEnabled,
        bulkUploadData,
        setBulkUploadData,
        downloadPayments,
        setPaymentsData,
        maskKey,

        totalReceivables,
        onboardingAction,
        setOnboardingAction,
        businessInfo,
        setBusinessInfo,
        customerInvoices,
        setCustomerInvoices,
        walletKitIsOpen,
        setWalletKitIsOpen,
        network,
        setNetwork,
        connecting,
        setConnecting,
        loadedContractId,
        setLoadedContractId,
        contractOperations,
        setContractOperations,
        contractAddr,
        setContractAddr,
      }}
    >
      {children}
    </StatesContext.Provider>
  );
}

export function useStates() {
  const context = useContext(StatesContext);
  if (context === undefined)
    throw new Error("States context was used outside StateProvider");
  return context;
}

// export { StatesProvider, useStates };StatesProvider
