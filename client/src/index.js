import React from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter,Routes,Route,Link} from 'react-router-dom';
import Verification from './pages/Verfication';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerificationCode from './pages/VerificationCode';
import DriverHome from './pages/DriverHome';
import Ride from './pages/Ride';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <BrowserRouter>
        <Routes>
            <Route path = "/" element = {<Home />} />
            <Route path = "/register" element = {<Register/>} />
            <Route path="/verificationCode" element={<VerificationCode/>} />
            <Route path = "/login" element = {<Login />} />
            <Route path = "/signup" element = {<Register />} />
            <Route path = "/drive" element = {<DriverHome />} />
            <Route path = "/verify" element = {<Verification />} />
            <Route path="/verificationCode" element={<VerificationCode/>} />
            {/* <Route path="/ride"> */}
            <Route path="/ride/:rideId" element = {<Ride />}/>
            {/* </Route> */}
            <Route path = "/*" element = {<h1>NOT FOUND</h1>} />
        </Routes>
    </BrowserRouter>
);
