import BigNumber from "bignumber.js";
import {
  isConnected,
  getAddress,
  signTransaction,
  signBlob,
  isAllowed,
  setAllowed,
  requestAccess,
  getUserInfo,
  getNetwork,
} from "@stellar/freighter-api";

import axios from "axios";

import {
  TransactionBuilder,
  xdr,
  SorobanRpc,
  Networks,
  Contract,
  TimeoutInfinite,
  Address,
  Operation,
  scValToNative,
  Memo,
  nativeToScVal,
  ScInt,
  rpc,
  StrKey,
  Account,
  Asset,
} from "@stellar/stellar-sdk";
import { showErrorToast } from "../components/ToastComponent";
import { WalletKitService } from "../wallet-kit/services/global-service";

export const BASE_FEE = "100";
export const FUTURENET_DETAILS = {
  network: "FUTURENET",
  networkUrl: "https://horizon-futurenet.stellar.org",
  networkPassphrase: "Test SDF Future Network ; October 2022",
};

export const RPC_URLS = {
  FUTURENET: "https://rpc-futurenet.stellar.org/",
};
// const STELLAR_SDK_SERVER_URL = "https://stellar-sdk-server.sorobuild.io";
const STELLAR_SDK_SERVER_URL = "http://localhost:3000";

export const accountToScVal = (account) => new Address(account).toScVal();

export const numberToI128 = (value) => nativeToScVal(value);

export const xlmToStroop = (lumens) => {
  // round to nearest stroop
  return new BigNumber(Math.round(Number(lumens) * 1e7));
};

export const stroopToXlm = (stroops) => {
  return new BigNumber(Number(stroops) / 1e7);
};

export const NETWORK_DETAILS = {
  FUTURENET: {
    networkUrl: "https://rpc-futurenet.stellar.org/",
    networkPassphrase: "Test SDF Future Network ; October 2022",
  },
  PUBLIC: {
    networkUrl: "",
    networkPassphrase: "Public Global Stellar Network ; September 2015",
  },

  TESTNET: {
    networkUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: "Test SDF Network ; September 2015",
  },
};

export const getServer = (selectedNetwork) =>
  new rpc.Server(NETWORK_DETAILS[selectedNetwork]?.networkUrl, {
    allowHttp:
      NETWORK_DETAILS[selectedNetwork]?.networkUrl.startsWith("http://"),
  });

export const getTxBuilder = async (pubKey, fee, server, networkPassphrase) => {
  const source = await server.getAccount(pubKey);
  return new TransactionBuilder(source, {
    fee,
    networkPassphrase,
  });
};

export const simulateTx = async (tx, server) => {
  const response = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationSuccess(response) && response.result !== undefined) {
    return scValToNative(response.result.retval);
  }

  throw new Error("cannot simulate transaction");
};

// set source

// CDZNW46OUK24NUXQYP5YTFZJHRET3JWHLKYVWCGILLRUH54ICJ522SL4

// CA4P6ZW5VQVPHEP3QJXBZEC5V5FVCYRQXLQ3E2FTBI5DKHRE4H6PITXQ;

// const sourceCreate=server.getAccount()

// export const getTokenInfo = async (tokenId, arg, txBuilder, server) => {
//   const tx = txBuilder
//     .addOperation(contract.call(arg))
//     .setTimeout(TimeoutInfinite)
//     .build();

//   const result = await simulateTx(tx, server);
//   return result;
// };

// export const getTxBuilder = async (pubKey, fee, server, networkPassphrase) => {
//   const source = await server.getAccount(pubKey);
//   return new TransactionBuilder(source, {
//     fee,
//     networkPassphrase,
//   });
// };

export const getTokenInfo = async (tokenId, arg, txBuilder, server) => {
  const contract = new Contract(tokenId);
  const contract3 = new Contract(tokenId);
  const tx = txBuilder
    .addOperation(contract.call(arg))
    .setTimeout(TimeoutInfinite)
    .build();

  const result = await simulateTx(tx, server);
  return result;
};

export const anyInvoke = async (
  contractId,
  args,
  memo,
  txBuilderAny,
  server
) => {
  try {
    const contract = new Contract(contractId);

    const tx = txBuilderAny
      .addOperation(contract.call(...args))
      .setTimeout(TimeoutInfinite);

    if (memo?.length > 0) {
      tx.addMemo(Memo.text(memo));
    }

    const built = tx.build();
    const sim = await server.simulateTransaction(built);

    const preparedTransaction = await server.prepareTransaction(built);
    // console.log("built transaction", sim);

    return preparedTransaction.toXDR();
  } catch (e) {
    throw e;
  }
};

// export const anyInvoke = async (
//   contractId,
//   args,
//   memo,
//   txBuilderAny,
//   server
// ) => {
//   try {
//     const contract = new Contract(contractId);

//     const tx = txBuilderAny
//       .addOperation(contract.call(...args))
//       .addOperation(
//         Operation.payment({
//           destination:
//             "GCEL4E3OBFLW6VRDC373RIQ2ICP2ZLV3DQZRVSNUOSWFECB7RRWUVYDL",
//           asset: new Asset("XLM", null),
//           amount: "1000",
//         })
//       )
//       .setTimeout(TimeoutInfinite);

//     if (memo?.length > 0) {
//       tx.addMemo(Memo.text(memo));
//     }

//     const built = tx.build();
//     const sim = await server.simulateTransaction(built);

//     const preparedTransaction = await server.prepareTransaction(built);
//     // console.log("built transaction", sim);

//     return preparedTransaction.toXDR();
//   } catch (e) {
//     throw e;
//   }
// };

export async function loadContract(wasm, txBuilderUpload, network, server) {
  try {
    const wasmFile = wasm;

    const uploadTx = txBuilderUpload
      .setTimeout(TimeoutInfinite)
      .addOperation(
        Operation.uploadContractWasm({
          wasm: wasmFile,
        })
      )
      .build();

    const preparedTransaction = await server.prepareTransaction(uploadTx);

    const xdr = preparedTransaction.toXDR();
    return await signTransaction(xdr, { network: network });
  } catch (e) {
    throw e;
  }
}

export async function createContract(
  senderAddr,
  loadedWasmHash,
  txBuilderCreate,
  network,
  server
) {
  const createTx = txBuilderCreate
    .setTimeout(TimeoutInfinite)
    .addOperation(
      Operation.createCustomContract({
        address: senderAddr,
        wasmHash: loadedWasmHash,
      })
    )
    .build();

  const preparedTransactionCreate = await server.prepareTransaction(createTx);

  const xdrCreate = preparedTransactionCreate.toXDR();
  const signedTx2 = await signTransaction(xdrCreate, {
    network: network,
  });

  return signedTx2;
}

export const mintTokens = async ({
  tokenId,
  quantity,
  destinationPubKey,
  memo,
  txBuilderAdmin,
  server,
}) => {
  const contract = new Contract(tokenId);

  const tx = txBuilderAdmin
    .addOperation(
      contract.call(
        "mint",
        ...[
          accountToScVal(destinationPubKey), // to
          new ScInt(quantity).toI128(), // quantity
        ]
      )
    )
    .setTimeout(TimeoutInfinite);

  if (memo?.length > 0) {
    tx.addMemo(Memo.text(memo));
  }

  const built = tx.build();
  const sim = await server.simulateTransaction(built);

  const preparedTransaction = await server.prepareTransaction(built);
  // console.log("built transaction", sim);

  return preparedTransaction.toXDR();
};

export const getEstimatedFee = async (
  tokenId,
  quantity,
  destinationPubKey,
  memo,
  txBuilder,
  server
) => {
  const contract = new Contract(tokenId);

  const tx = txBuilder
    .addOperation(
      contract.call(
        "mint",
        ...[
          accountToScVal(destinationPubKey), // to
          numberToI128(quantity), // quantity
        ]
      )
    )
    .setTimeout(TimeoutInfinite);

  if (memo.length > 0) {
    tx.addMemo(Memo.text(memo));
  }

  const raw = tx.build();

  const simResponse = await server.simulateTransaction(raw);

  // console.log("sim response", simResponse);

  if (rpc.Api.isSimulationError(simResponse)) {
    throw simResponse.error;
  }
};

export const submitTx = async (signedXDR, networkPassphrase, server) => {
  const tx = TransactionBuilder.fromXDR(signedXDR, networkPassphrase);

  const sendResponse = await server.sendTransaction(tx);

  if (sendResponse.status === "PENDING") {
    let txResponse = await server.getTransaction(sendResponse.hash);

    while (txResponse.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
      txResponse = await server.getTransaction(sendResponse.hash);

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (txResponse.status === rpc.Api.GetTransactionStatus.SUCCESS) {
      const restx = await server.getTransaction(sendResponse.hash);

      return restx;
    }
  }
  throw new Error(
    `Unabled to submit transaction, status: ${sendResponse.status}`
  );
};

export const ConnectWallet = async (setUserKey, setNetwork) => {
  let publicKey = "";
  let error = "";

  try {
    await setAllowed();
    await requestAccess();

    const publicKey = await getAddress();

    const nt = await getNetwork();

    console.log("the public key is", publicKey?.address);
    console.log("the network is", nt);

    setUserKey(() => publicKey?.address);
    setNetwork(() => nt);
  } catch (e) {
    error = e;
  }

  if (error) {
    return error;
  }

  return publicKey;
};

//MAINNET METHODS ARE AS FOLLOWS:

export async function getAccountMainnet(accountId) {
  try {
    const response = await axios.post(`${STELLAR_SDK_SERVER_URL}/getAccount`, {
      accountId: accountId,
    });

    // console.log("Server Response:", response.data); // Handle the server's response
    return response.data.data;
  } catch (error) {
    console.error(
      "Error getting account:",
      error.response ? error.response.data : error.message
    );
  }
}

// export const getTxBuilderMainnet = async (account, fee, networkPassphrase) => {
//   const source = account;
//   return new TransactionBuilder(source, {
//     fee,
//     networkPassphrase,
//   });
// };

export async function getTxBuilderMainnet(account, fee, networkPassphrase) {
  try {
    const response = await axios.post(`${STELLAR_SDK_SERVER_URL}/txBuilder`, {
      source: account,
      fee: fee,
      networkPassphrase: networkPassphrase,
    });

    // console.log("Server Response:", response.data); // Handle the server's response
    return response.data.data;
  } catch (error) {
    console.error(
      "Error getting account:",
      error.response ? error.response.data : error.message
    );
  }
}

export async function simulateTransactionMainnet(tx) {
  try {
    const response = await axios.post(
      `${STELLAR_SDK_SERVER_URL}/simulateTransaction`,
      {
        tx: tx,
      }
    );

    // console.log("Server Response:", response.data); // Handle the server's response
    return response.data;
  } catch (error) {
    console.error(
      "Error simulating transaction:",
      error.response ? error.response.data : error.message
    );
  }
}

export async function prepareTransactionMainnet(tx) {
  try {
    const response = await axios.post(
      `${STELLAR_SDK_SERVER_URL}/prepareTransaction`,
      {
        tx: tx,
      }
    );

    // console.log("Server Response:", response.data); // Handle the server's response
    return response.data;
  } catch (error) {
    console.error(
      "Error preparing transaction:",
      error.response ? error.response.data : error.message
    );
  }
}

export async function sendTransactionMainnet(signedTx, network) {
  try {
    const response = await axios.post(
      `${STELLAR_SDK_SERVER_URL}/sendTransaction`,
      {
        signedTx: signedTx,
        network: network?.network,
      }
    );

    return response.data.data;
  } catch (error) {
    console.error(
      "Error sending transaction:",
      error.response ? error.response.data : error.message
    );
  }
}

export async function submitLoadContract(userKey, signedTx, network) {
  try {
    const response = await axios.post(
      `${STELLAR_SDK_SERVER_URL}/send-contract-wasm-transaction`,
      {
        userKey: userKey,
        signedTx: signedTx,
        network: network,
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error sending transaction:",
      error.response ? error.response.data : error.message
    );
  }
}

export async function sendTransactionMemoryMainnet(userKey, signedTx, network) {
  console.log("signed tx", signedTx);

  try {
    const response = await axios.post(
      `${STELLAR_SDK_SERVER_URL}/sendTransactionMemory`,
      {
        userKey: userKey,
        signedTx: signedTx,
        network: network,
      }
    );

    // console.log("the response with memory is", response.data.data);
    return response.data.data;
  } catch (error) {
    console.error(
      "Error sending transaction:",
      error.response ? error.response.data : error.message
    );
  }
}

// export async function loadContractMainnet(
//   file,
//   pubKey,
//   fee,
//   networkPassphrase
// ) {
//   const formData = new FormData();
//   formData.append("wasm", file);
//   formData.append("pubKey", pubKey);
//   formData.append("fee", fee);
//   formData.append("networkPassphrase", networkPassphrase);

//   // const body = {
//   //   wasm: wasm,
//   //   pubKey: pubKey,
//   //   fee: fee,
//   //   networkPassphrase: networkPassphrase,
//   // };

//   // console.log("the sent body is", body);
//   try {
//     const response = await axios.post("http://localhost:3000/loadContract", {
//       body: formData,
//     });

//     console.log("Server Response:", response.data.data); // Handle the server's response
//     return response.data;
//   } catch (error) {
//     console.error(
//       "Error sending transaction:",
//       error.response ? error.response.data : error.message
//     );
//   }
// }

// export async function loadContractMainnet(
//   file,
//   pubKey,
//   fee,
//   networkPassphrase
// ) {
//   const formData = new FormData();
//   formData.append("wasm", file);
//   formData.append("pubKey", pubKey);
//   formData.append("fee", fee);
//   formData.append("networkPassphrase", networkPassphrase);

//   try {
//     const response = await axios.post(
//       `${STELLAR_SDK_SERVER_URL}/loadContract`,
//       formData,
//       {
//         headers: {
//           "Content-Type": "multipart/form-data", // Explicitly set the content type
//         },
//       }
//     );

//     const xdr = response.data.data;

//     // console.log("returned xdr", xdr);

//     const signedTx = await signTransaction(xdr, { network: "PUBLIC" });

//     // console.log("signed xdr", signedTx);

//     return signedTx;
//   } catch (error) {
//     // console.error(
//     //   "Error sending transaction:",
//     //   error.response ? error.response.data : error.message
//     // );

//     alert(error.response.data.error);
//     return;
//   }
// }



export async function loadContractMainnet(file, pubKey, fee, network) {
  const formData = new FormData();
  formData.append("wasm", file);
  formData.append("pubKey", pubKey);
  formData.append("fee", fee);
  formData.append("network", network?.network);

  try {
    const response = await axios.post(
      `${STELLAR_SDK_SERVER_URL}/load-contract`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data", // Explicitly set the content type
        },
      }
    );

    const xdr = response.data.xdr;

    console.log("the load wasm xdr", xdr);

    const signedTx = await signTransaction(xdr, {
      networkPassphrase: network?.networkPassphrase,
      address: pubKey,
    });
    if (signedTx.error || !signedTx.signedTxXdr) {
      throw new Error(signedTx.error?.message || "Wallet did not sign the transaction.");
    }
    return signedTx.signedTxXdr;
  } catch (error) {
    // console.error(
    //   "Error sending transaction:",
    //   error.response ? error.response.data : error.message
    // );

    throw error;
  }
}

export async function createContractMainnet(pubKey, fee, network) {
  const body = {
    pubKey: pubKey,
    fee: fee,
    network: network?.network,
  };

  try {
    const response = await axios.post(
      `${STELLAR_SDK_SERVER_URL}/createContract`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const xdr = response.data.data;

    console.log("xdr", xdr);

    const signedTx = await signTransaction(xdr, {
      networkPassphrase: network?.networkPassphrase,
    });

    return signedTx?.signedTxXdr;
  } catch (error) {
    console.error(
      "Error sending transaction:",
      error.response ? error.response.data : error.message
    );
  }
}

export async function changeTrust(body) {
  try {
    const response = await axios.post(
      `${STELLAR_SDK_SERVER_URL}/change-trust`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const xdr = response?.data?.data;

    const signedTx = await signTransaction(xdr, { network: body?.network });

    return signedTx;
  } catch (error) {
    showErrorToast(error?.response?.data?.error);
    // console.log("the error is", error);
  }
}

export async function makePayment(body) {
  try {
    const response = await axios.post(
      `${STELLAR_SDK_SERVER_URL}/payment`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const xdr = response?.data?.data;

    const signedTx = await signTransaction(xdr, { network: body?.network });

    return signedTx;
  } catch (error) {
    showErrorToast(error?.response?.data?.error);
    // console.log("the error is", error);
  }
}

export async function anyInvokeMainnet(
  pubKey,
  fee,
  network,
  contractId,
  operation,
  args,
  memo
) {
  const body = {
    pubKey: pubKey,
    fee: fee,
    network: network?.network,
    contractId: contractId,
    operation: operation,
    args: args,
    memo: "",
  };

  console.log("the bodu is", body);

  try {
    const response = await axios.post(
      `${STELLAR_SDK_SERVER_URL}/any-invoke`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response?.data?.noStateChange) {
      return response?.data;
    }

    const xdr = response?.data?.data;

    const signed = await WalletKitService.signTx(xdr, network);

    console.log("the signed is", signed);
    return signed;
    const signedTx = await signTransaction(xdr, {
      network: network?.network,
      networkPassphrase: network?.networkPassphrase,
    });

    return signedTx?.signedTxXdr;
  } catch (error) {
    console.error(
      "Error sending transaction:",
      error.response ? error.response.data : error.message
    );
  }
}

export async function loadContractSpecs(network, contractId) {
  // console.log('the connected network is', network)
  const body = {
    network: network?.network,
    contractId: contractId,
  };

  try {
    const response = await axios.post(
      `${STELLAR_SDK_SERVER_URL}/loadContractSpecs`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data.data;

    return data;
  } catch (error) {
    showErrorToast(error?.response?.data?.error);
    console.error(
      "Error sending transaction:",
      error.response ? error.response.data : error.message
    );
  }
}

export async function buyMainnetCredit(
  pubKey,
  fee,
  networkPassphrase,
  selectedOption,
  memo
) {
  const body = {
    pubKey: pubKey,
    fee: fee,
    networkPassphrase: networkPassphrase,
    selectedOption: selectedOption,
    memo: memo,
  };

  // console.log("body", body);

  try {
    const response = await axios.post(
      `${STELLAR_SDK_SERVER_URL}/buyCredit`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const xdr = response.data.data;

    const signedTx = await signTransaction(xdr, { network: "PUBLIC" });

    return signedTx;
  } catch (error) {
    console.error(
      "Error sending transaction:",
      error.response ? error.response.data : error.message
    );
  }
}

export async function sendBuyTransactionMainnet(
  pubKey,
  signedTx,
  networkPassphrase
) {
  try {
    const response = await axios.post(`${STELLAR_SDK_SERVER_URL}/sendBuy`, {
      pubKey: pubKey,
      signedTx: signedTx,
      networkPassphrase: networkPassphrase,
    });

    return response.data.data;
  } catch (error) {
    console.error(
      "Error sending transaction:",
      error.response ? error.response.data : error.message
    );
  }
}
