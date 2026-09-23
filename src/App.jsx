import { useState } from "react";
import FarmFund from "./components/FarmFund";
import Dashboard from "./components/Dashboard";
import "./index.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (isLoggedIn) {
    return <Dashboard onSignOut={() => setIsLoggedIn(false)} />;
  }

  return <FarmFund onLoginSuccess={() => setIsLoggedIn(true)} />;
}

export default App;