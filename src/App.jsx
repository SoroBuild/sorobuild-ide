import SorobuildIDE from './pages/ide-files/SorobuildeIDE';
import { WorkspaceProvider } from './ide/WorkspaceContext';
export default function App() { return <WorkspaceProvider><SorobuildIDE /></WorkspaceProvider>; }
