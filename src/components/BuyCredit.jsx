import { CloseCircle } from "iconsax-react";
import React, { useState } from "react";
import {
  buyMainnetCredit,
  xlmToStroop,
  NETWORK_DETAILS,
  sendBuyTransactionMainnet,
} from "../utils/soroban";

export default function BuyCredit({
  buyOpen,
  setBuyOpen,
  userKey,
  network,
  connecting,
  setConnecting,
}) {
  const [selectedOption, setSelectedOption] = useState(null);
  const selectedNetwork = NETWORK_DETAILS[network];
  // console.log("the selected option is", selectedOption);
  const options = [
    { id: 1, credit: 5, cost: 25 },
    { id: 2, credit: 10, cost: 40 },
    { id: 3, credit: 25, cost: 75 },
    { id: 4, credit: 50, cost: 100 },
    { id: 5, credit: 100, cost: 150 },
    { id: 6, credit: 500, cost: 375 },
    { id: 7, credit: 1000, cost: 600 },
  ];
  if (!buyOpen) return null;

  function handleClose() {
    setBuyOpen(false);
  }

  async function buyMainnetHandler() {
    setConnecting(true);
    const memo = "Buy Credit";
    const signedTx = await buyMainnetCredit(
      userKey,
      xlmToStroop(1).toString(),
      selectedNetwork.networkPassphrase,
      selectedOption?.id,
      memo
    );

    const res = await sendBuyTransactionMainnet(
      userKey,
      signedTx,
      selectedNetwork.networkPassphrase
    );
    setConnecting(false);

    handleClose();

    console.log("buy transaction res is", res);
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center h-full bg-gray-900 bg-opacity-70">
      <div className="py-5 bg-gray-200 w-full max-w-md  rounded-sm relative">
        <button className="absolute top-0 right-0 m-2" onClick={handleClose}>
          <CloseCircle className="text-gray-800" />
        </button>
        <div className="px-4 mx-auto  max-w-xl  mt-2">
          <div className="max-w-sm mx-auto">
            <p className="text-lg font-bold text-gray-900">
              Buy Invoke Credit Topup
            </p>

            <div className="mt-4 overflow-auto  border-t border-gray-300 divide-y divide-gray-300   h-[350px]">
              {options?.map((option, index) => (
                <div
                  onClick={() => setSelectedOption(option)}
                  key={option?.credit}
                  className=" py-3 transition-all duration-200  cursor-pointer hover:bg-gray-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 ml-4">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {option?.credit} Invoke Credits
                      </p>
                      <p className="mt-1 text-sm font-medium text-gray-500 truncate">
                        for {option?.cost} XLM
                      </p>
                    </div>

                    <svg
                      className={`w-6 h-6 ml-4 text-indigo-600 ${
                        selectedOption?.credit !== option?.credit && "opacity-0"
                      }`}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="1.5"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={buyMainnetHandler}
              className={`mt-4
                      
              py-2
              text-base
              font-semibold
              leading-7
              text-gray-100
              bg-gray-900
              transition-all
              duration-200
           
              border border-gray-900
              rounded-sm
              font-pj
           w-full
              
              hover:bg-gray-900 hover:text-white ${
                selectedOption === null && "opacity-25"
              }`}
              role="button"
              disabled={selectedOption === null}
            >
              {connecting ? "Processing..." : "Buy now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
