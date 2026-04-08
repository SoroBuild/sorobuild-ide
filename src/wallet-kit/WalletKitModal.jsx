import React, { useEffect, useState } from "react";
import { WalletKitService } from "./services/global-service";
import { useStates } from "../contexts/StatesContext";

export default function WalletKitModal() {
  const [isAvailableMap, setIsAvailableMap] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  const {
    walletKitIsOpen,
    setWalletKitIsOpen,
    setUserKey,
    setNetwork,

    walletApp,
    setWalletApp,
  } = useStates();
  const stellarWalletKitOptions = WalletKitService.walletKit.modules;

  useEffect(() => {
    Promise.all(
      stellarWalletKitOptions.map(({ isAvailable }) => isAvailable())
    ).then((results) => {
      const map = new Map();
      results.forEach((isAvailable, index) => {
        map.set(stellarWalletKitOptions[index].productName, isAvailable);
      });
      setIsAvailableMap(map);
    });
  }, [stellarWalletKitOptions]);

  // Mount and show modal
  useEffect(() => {
    if (walletKitIsOpen) {
      setShouldRender(true);
      // small timeout to trigger enter transition
      setTimeout(() => setIsVisible(true), 20);
    } else {
      setIsVisible(false);
      setTimeout(() => setShouldRender(false), 300); // Match transition duration
    }
  }, [walletKitIsOpen]);

  const closeHandler = () => {
    setWalletKitIsOpen(false);
  };

  const handleDownload = (url) => {
    window.open(url, "_blank");
  };

  if (!shouldRender) return null;

  return (
    <div
      onClick={closeHandler}
      className="fixed inset-0 z-50 flex items-center justify-center px-2 py-5 sm:p-6 bg-gray-500/35"
    >
      {/* Modal Panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg bg-white shadow-lg rounded-xl relative transform transition-all duration-300 ease-in-out ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
      >
        <svg
          className="absolute w-5 text-gray-500 h-auto top-0 right-0 mt-4 mr-4 cursor-pointer"
          onClick={closeHandler} // Close on click
          viewBox="0 0 32 32"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M18.24 16L26.08 8.16C26.3721 7.86194 26.5348 7.46064 26.5327 7.04332C26.5306 6.62599 26.3638 6.22636 26.0687 5.93126C25.7736 5.63616 25.374 5.46944 24.9567 5.46734C24.5394 5.46523 24.1381 5.6279 23.84 5.92L16 13.76L8.16 5.92C7.86194 5.6279 7.46064 5.46523 7.04332 5.46734C6.62599 5.46944 6.22636 5.63616 5.93126 5.93126C5.63616 6.22636 5.46944 6.62599 5.46734 7.04332C5.46523 7.46064 5.6279 7.86194 5.92 8.16L13.76 16L5.92 23.84C5.6279 24.1381 5.46523 24.5394 5.46734 24.9567C5.46944 25.374 5.63616 25.7736 5.93126 26.0687C6.22636 26.3638 6.62599 26.5306 7.04332 26.5327C7.46064 26.5348 7.86194 26.3721 8.16 26.08L16 18.24L23.84 26.08C24.1381 26.3721 24.5394 26.5348 24.9567 26.5327C25.374 26.5306 25.7736 26.3638 26.0687 26.0687C26.3638 25.7736 26.5306 25.374 26.5327 24.9567C26.5348 24.5394 26.3721 24.1381 26.08 23.84L18.24 16Z"
            fill="currentColor"
          />
        </svg>

        {/* Modal Content */}
        <div className="px-4 py-5 sm:p-6">
          <p className="text-xl font-bold text-gray-900">Stellar Wallet Kit</p>
          <p className="mt-3 text-sm font-medium text-gray-500">
            Select from Stellar Wallet Kit options
          </p>

          <div className="mt-6 space-y-3">
            {stellarWalletKitOptions?.map((option) => (
              <div
                onClick={() => {
                  isAvailableMap.get(option?.productName)
                    ? WalletKitService.login(
                        option?.productId,
                        setUserKey,
                        setNetwork
                      )
                    : handleDownload(option?.productUrl);
                  setWalletKitIsOpen(false);

                  setWalletApp(option?.productId);
                }}
                key={option?.productName}
                className="overflow-hidden border border-gray-200 cursor-pointer bg-white shadow-sm rounded-xl transform transition-transform duration-300 hover:translate-x-1 hover:translate-y-1"
              >
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center justify-between space-x-5">
                    <div className="flex items-center flex-1">
                      <img
                        className="flex-shrink-0 object-cover w-10 h-10 rounded-full"
                        src={option?.productIcon}
                        alt=""
                      />
                      <div className="flex-1 min-w-0 ml-4">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {option?.productName}
                        </p>
                        <p className="mt-1 text-sm font-medium text-gray-500 truncate">
                          {option?.productUrl}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-3">
                      {!isAvailableMap?.get(option?.productName) ? (
                        <svg
                          className="w-6 h-auto text-gray-600"
                          viewBox="0 0 32 32"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M26 20V24C26 25.1046 25.1046 26 24 26H8C6.89543 26 6 25.1046 6 24V20H8V24H24V20H26ZM17 16.5858L20.2929 13.2929L21.7071 14.7071L16 20.4142L10.2929 14.7071L11.7071 13.2929L15 16.5858V6H17V16.5858Z"
                            fill="currentColor"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-6 h-auto text-gray-600"
                          viewBox="0 0 32 32"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M18.6922 16L9.89742 7.20518L11.6026 5.5L22.1026 16L11.6026 26.5L9.89742 24.7948L18.6922 16Z"
                            fill="black"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* <div className="mt-6 space-y-3">
            {stellarWalletKitOptions?.map((option) => (
              <div
                key={option?.productName}
                onClick={() => {
                  isAvailableMap.get(option?.productName)
                    ? WalletKitService.login(option?.productId)
                    : handleDownload(option?.productUrl);
                }}
                className="overflow-hidden border border-gray-200 cursor-pointer bg-white shadow-sm rounded-xl transform transition-transform duration-300 hover:translate-x-1 hover:translate-y-1"
              >
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center justify-between space-x-5">
                    <div className="flex items-center flex-1">
                      <img
                        className="flex-shrink-0 object-cover w-10 h-10 rounded-full"
                        src={option?.productIcon}
                        alt=""
                      />
                      <div className="flex-1 min-w-0 ml-4">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {option?.productName}
                        </p>
                        <p className="mt-1 text-sm font-medium text-gray-500 truncate">
                          {option?.productUrl}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-3">
                      {!isAvailableMap?.get(option?.productName) ? (
                        <svg
                          className="w-6 h-auto text-gray-600"
                          viewBox="0 0 32 32"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M26 20V24C26 25.1046..."
                            fill="currentColor"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-6 h-auto text-gray-600"
                          viewBox="0 0 32 32"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M18.6922 16L9.89742 7.20518..."
                            fill="black"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div> */}
        </div>
      </div>
    </div>
  );
}
