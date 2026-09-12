import { createContext, useContext, useState } from 'react';
const WorkspaceContext = createContext(null);
export function WorkspaceProvider({ children }) {
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  return <WorkspaceContext.Provider value={{ showNewFileModal, setShowNewFileModal, showNewFolderModal, setShowNewFolderModal }}>{children}</WorkspaceContext.Provider>;
}
export const useStates = () => useContext(WorkspaceContext);
