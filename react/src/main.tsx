import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import "./index.css";
import { JazzAndAuth } from "./common/JazzAndAuth.tsx";
import { HomePage } from "./home/HomePage.tsx";
import { IntegrationsPage } from "./integrations/IntegrationsPage.tsx";


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <JazzAndAuth>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage/>} />
          <Route path="/integrations" element={<IntegrationsPage/>} />
        </Routes>
      </BrowserRouter>
    </JazzAndAuth>
  </StrictMode>,
);
