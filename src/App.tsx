import React, { useState } from "react";
import { BrowserRouter } from "react-router-dom";
import SplashScreen from "./components/SplashScreen";
import { AuthProvider } from "./context/AuthContext";
import { CourtsProvider } from "./context/CourtsContext";
import { GroupOrderProvider } from "./context/GroupOrderContext";
import AppRoutes from "./routes/AppRoutes";
import "./App.css";

export const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <BrowserRouter>
      <AuthProvider>
        <CourtsProvider>
          <GroupOrderProvider>
            {isLoading && <SplashScreen onDone={() => setIsLoading(false)} />}
            <AppRoutes />
          </GroupOrderProvider>
        </CourtsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
