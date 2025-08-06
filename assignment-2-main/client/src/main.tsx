import { StrictMode } from "react";
import * as React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import { rootStore, RootStoreContext } from "./stores/RootStore";
import AppRoutes from "./routes";
import { ConfigProvider } from "antd";

const container = document.getElementById("root");
if (!container) throw new Error("Root container not found");

const root = ReactDOM.createRoot(container);

root.render(
    <React.StrictMode>
        <RootStoreContext.Provider value={rootStore}>
            <ConfigProvider>
                <BrowserRouter>
                    <AppRoutes />
                </BrowserRouter>
            </ConfigProvider>
        </RootStoreContext.Provider>
    </React.StrictMode>
);