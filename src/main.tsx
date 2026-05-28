import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// SPA redirect handler: if 404.html stored a path, navigate there
const redirectPath = sessionStorage.getItem('spa-redirect');
if (redirectPath) {
  sessionStorage.removeItem('spa-redirect');
  window.history.replaceState(null, '', redirectPath);
}

createRoot(document.getElementById("root")!).render(<App />);
