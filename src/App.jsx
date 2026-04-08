import { StatesProvider } from "./contexts/StatesContext";
import SorobuildIDE from "./pages/ide-files/SorobuildeIDE";

function App() {
  return (
    <StatesProvider>
      <SorobuildIDE />
    </StatesProvider>
  );
}

export default App;
