import logo from './logo.svg';
import './App.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import React from "react";
import { Routes, Route } from "react-router-dom";

import ImportPage from "./components/importPage";
import MetaPage from "./components/metaPage";
import OtherPage from "./components/otherPage";
import OutputPage from "./components/outputPage";
import ImportError from "./components/ImportError";

function App() {

  return (
    <div>
      <Routes>
      <Route path="" element={<ImportPage />} />
      <Route path="meta" element={<MetaPage />} />
      <Route path="other" element={<OtherPage />} />
      <Route path="output" element={<OutputPage />} />
      <Route path="importerror" element={<ImportError />} />
      </Routes>
    </div>
  );
};

export default App;
