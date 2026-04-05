import React from "react";

const tabs = [
  { id: "interact", label: "Interact", shortLabel: "Interact" },
  { id: "asset", label: "Asset Tools", shortLabel: "Assets" },
  { id: "contract", label: "Deploy Contract", shortLabel: "Deploy" },
  { id: "load", label: "Load Wasm", shortLabel: "Load" },
];

export default function PairedButton({
  setContractAddr,
  setLoadedContractId,
  setContractOperations,
  selectedTab,
  setSelectedTab,
}) {
  function handleSelect(tabId) {
    setSelectedTab(tabId);

    if (tabId !== "interact") {
      setContractAddr("");
      setLoadedContractId("");
      setContractOperations([]);
    }
  }

  return (
    <div className="w-full">
      <div className="hidden sm:grid grid-cols-4 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
        {tabs.map((tab) => {
          const active = selectedTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelect(tab.id)}
              className={`inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                active
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-transparent text-slate-600 hover:bg-white hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="sm:hidden overflow-x-auto">
        <div className="flex min-w-max gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
          {tabs.map((tab) => {
            const active = selectedTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelect(tab.id)}
                className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-transparent text-slate-600 hover:bg-white hover:text-slate-900"
                }`}
              >
                {tab.shortLabel}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
