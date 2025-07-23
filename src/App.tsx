import React, { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { initializeDevTools } from "./utils/devtools";
import router from "./router";

const App: React.FC = () => {
    useEffect(() => {
        initializeDevTools();
    }, []);

    return (
        <ThemeProvider>
            <RouterProvider router={router} />
        </ThemeProvider>
    );
};

export default App; 