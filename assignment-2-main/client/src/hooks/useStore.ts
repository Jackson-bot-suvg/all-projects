import { useContext } from "react";
import { RootStoreContext } from "../stores/RootStore";

export const useStore = () => useContext(RootStoreContext);
export default useStore