import { BrowserRouter } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext.jsx";
import AppRouter from "./router/AppRouter.jsx";

function App() {
  return (
    <BrowserRouter basename="/Javedan-X">
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
