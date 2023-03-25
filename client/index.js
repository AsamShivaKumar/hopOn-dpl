import React from 'react';
import ReactDOM from 'react-dom/client';
import "./index.css"
import {BrowserRouter,Routes,Route} from 'react-router-dom';
import {CookiesProvider} from "react-cookie";
import Login from './components/Login';
import Register from './components/Register';
import VerificationCode from './components/VerificationCode';
import DriverHome from './pages/DriverHome';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <CookiesProvider>
        <BrowserRouter>
            <Routes>
                <Route path = "/register" element = {<Register/>} />
                <Route path="/verificationCode" element={<VerificationCode/>} />
                <Route path = "/" element = {<Login/>} />
                <Route path = "/driverHome" element = {<DriverHome/>} />
                <Route path = "/drive" element = {<h1>Driver Page</h1>} />
                <Route path = "/verify" element = {<h1>Driver Verification</h1>} />
                <Route path = "/*" element = {<h1>NOT FOUND</h1>} />
            </Routes>
        </BrowserRouter>
    </CookiesProvider>
);
