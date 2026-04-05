import { toast } from "sonner";
export const showSuccessToast = (msg, txHash, network) => {
  toast.success(
    <div className="flex  items-center justify-between">
      <span>{msg}</span>
      <button
        onClick={() =>
          window.open(
            `https://stellar.expert/explorer/${network?.toLowerCase()}/tx/${txHash}`,
            "_blank"
          )
        }
        className="ml-4 text-green-600 underline hover:text-green-800"
      >
        View in Explorer
      </button>
    </div>
  );
};

export const showErrorToast = (errorMsg) => {
  toast.error(
    <div className="flex  items-center justify-between">
      <span>{errorMsg}</span>
      {/* <button
        onClick={() =>
          window.open(
            `https://stellar.expert/explorer/testnet/tx/${txHash}`,
            "_blank"
          )
        }
        className="ml-4 text-green-600 underline hover:text-green-800"
      >
        View in Explorer
      </button> */}
    </div>
  );
};
