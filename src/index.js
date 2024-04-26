import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, HashRouter } from "react-router-dom";
import { processAdditionalArgs } from './components/populatePages';

const isDev = processAdditionalArgs('isDev');

const root = ReactDOM.createRoot(document.getElementById('root'));

// in dev uses browserrouter, in prod hashrouter, else pages don't load
if (isDev === "true") {
  root.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
} else {
  root.render(
    <HashRouter>
      <App />
    </HashRouter>
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
