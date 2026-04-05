import { Outlet } from "react-router-dom";
import Header from "./Header";
import WalletKitModal from "../wallet-kit/WalletKitModal";

export default function Layout() {
  return (
    <div>
      <Header />
      <WalletKitModal />
      <div>
        <Outlet />
      </div>
    </div>
  );
}
