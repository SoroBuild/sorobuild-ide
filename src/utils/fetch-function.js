import axios from "axios";
import { toast } from "sonner";

const invoiceData = {
  draft: false,
  due: 1736070266000,
  expiry: 1736070266000,
  description: "test invoice",
  mode: "INVOICE",
  note: "THIS IS A TEST",
  notifications: {
    channels: ["SMS", "EMAIL"],
    dispatch: true,
  },
  metadata: {
    udf1: "1",
    udf2: "2",
    udf3: "3",
  },
  charge: {
    receipt: {
      email: true,
      sms: true,
    },
  },
  customer: {
    //if new customer
    first_name: "Dan",
    last_name: "Sam",
    email: "answertab2015@gmail.com",
    phone: {
      country_code: "+965",
      number: "50030756",
    },
    //   id: "cus_TS05A0920240335n8QY2112029", //if it is to an existing customer
  },
  statement_descriptor: "test",
  order: {
    amount: 22,
    items: [
      {
        amount: 2,
        currency: "KWD",
        name: "mango",
        description: "mango",
        quantity: 6,
      },
      {
        amount: 1,
        currency: "KWD",
        name: "orange",
        description: "orange",
        quantity: 10,
      },
    ],
    currency: "KWD",
  },
  post: {
    url: "http://your_website.com/post_url",
  },
  redirect: {
    url: "http://your_website.com/redirect_url",
  },
  reference: {
    invoice: "INV_00001",
    order: "ORD_00001",
  },
  retry_for_captured: true,
};

// export const BASE_URL = "https://edartee-da6485e75e21.herokuapp.com";
export const BASE_URL = "https://edartee-staging-b887c8592f18.herokuapp.com"; //staging

export async function getRequest(resource, query, accessToken) {
  try {
    const url = !query?.trim()
      ? `${BASE_URL}/api/v2/${resource}`
      : `${BASE_URL}/api/v2/${resource}?${query}`;

    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`, // Add the token in the Authorization header
      },
    });

    if (res) {
      // console.log(res?.data?.data?.services);

      return res?.data?.data;
    }
  } catch (error) {
    console.error("Get Request Error", error);
    throw error; // Re-throw for error handling upstream
  }
}

// try {
//   setIsLoading(true);
//   const res = await axios.put(
//     `${BASE_URL}/api/v2/business/add-tap-key`,
//     body,
//     {
//       headers,
//     }
//   );
//   if (res) {
//     toast.success(res?.message);
//     setIsUpdateKey(false);
//   }
// } catch (e) {
//   toast.error(e?.response?.data?.error);
// } finally {
//   setIsLoading(false);
// }

export async function putRequest(
  resource,
  body,
  accessToken = "",
  tenant = ""
) {
  let headers = {
    Authorization: `Bearer ${accessToken}`, // Token added in headers
    "Content-Type": "application/json",
  };

  if (tenant !== "") {
    headers.tenantId = tenant;
  }

  try {
    const res = await axios.put(`${BASE_URL}/api/v2/${resource}`, body, {
      headers,
    });

    if (res) {
      return res.data;
    }
  } catch (e) {
    // alert(e.message);

    toast.error(e?.response?.data?.error);

    // toast.success("Data saved!");

    // alert(e?.response?.data?.error);
  }
}

export async function postRequest(
  resource,
  body,
  accessToken = "",
  tenant = ""
) {
  let headers = {
    Authorization: `Bearer ${accessToken}`, // Token added in headers
    "Content-Type": "application/json",
  };

  if (tenant !== "") {
    headers.tenantId = tenant;
  }

  try {
    const res = await axios.post(`${BASE_URL}/api/v2/${resource}`, body, {
      headers,
    });

    if (res) {
      return res.data;
    }
  } catch (e) {
    // alert(e.message);

    toast.error(e?.response?.data?.error);

    // toast.success("Data saved!");

    // alert(e?.response?.data?.error);
  }
}

export async function patchRequest(
  resource,
  body,
  accessToken = "",
  tenant = ""
) {
  let headers = {
    Authorization: `Bearer ${accessToken}`, // Token added in headers
    "Content-Type": "application/json",
  };

  if (tenant !== "") {
    headers.tenantId = tenant;
  }

  try {
    const res = await axios.patch(`${BASE_URL}/api/v2/${resource}`, body, {
      headers,
    });

    if (res) {
      return res.data;
    }
  } catch (e) {
    // alert(e.message);

    toast.error(e?.response?.data?.error);

    // toast.success("Data saved!");

    // alert(e?.response?.data?.error);
  }
}

export async function postMulti(resource, body, accessToken = "", tenant = "") {
  let headers = {
    Authorization: `Bearer ${accessToken}`, // Token added in headers
    // "Content-Type": "application/json",
  };

  if (tenant !== "") {
    headers.tenantId = tenant;
  }

  try {
    const res = await axios.post(`${BASE_URL}/api/v2/${resource}`, body, {
      headers,
    });

    if (res) {
      return res.data;
    }
  } catch (e) {
    // alert(e.message);

    toast.error(e?.response?.data?.error);

    // toast.success("Data saved!");

    // alert(e?.response?.data?.error);
  }
}

async function createInvoice() {
  try {
    // Make a POST request without the Authorization header
    const response = await axios.post(
      `${BASE_URL}/create-invoice`,
      invoiceData,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Invoice created successfully:", response.data);
    // Handle successful response, e.g., show success message or reset form
  } catch (err) {
    console.error(
      "Error creating invoice:",
      err.response ? err.response.data : err.message
    );
  } finally {
  }
}

const currentDate = Date.now();

const allInvoiceData = {
  period: {
    date: {
      from: "1735708800000", // Replace with actual 'from' timestamp
      to: `${currentDate}`, // Replace with actual 'to' timestamp
    },
  },
};

async function getAllInvoice() {
  try {
    // Make a POST request without the Authorization header
    const response = await axios.post(
      `${BASE_URL}/get-all-invoice`,
      allInvoiceData,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    console.log("fetch successfully:", response.data?.data?.invoices);
    // Handle successful response, e.g., show success message or reset form
  } catch (err) {
    console.error(
      "Error creating invoice:",
      err.response ? err.response.data : err.message
    );
  } finally {
  }
}
