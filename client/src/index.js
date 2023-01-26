import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js'
import {BrowserRouter,Routes,Route} from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <BrowserRouter>
        <Routes>
            <Route path = "/" element = {<h1>Home</h1>} />
            <Route path = "/login" element = {<h1>Login</h1>} />
            <Route path = "/signup" element = {<h1>SignUp</h1>} />
            <Route path = "/drive" element = {<h1>Driver Page</h1>} />
            <Route path = "/app" element = { <App />} />
            <Route path = "/*" element = {<h1>NOT FOUND</h1>} />
        </Routes>
    </BrowserRouter>
);
