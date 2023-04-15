import React from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter,Routes,Route, HashRouter} from 'react-router-dom';
import Verification from './pages/Verfication';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerificationCode from './pages/VerificationCode';
import DriverHome from './pages/DriverHome';
import Ride from './pages/Ride';
import DriverRide from './pages/DriverRide';
import ContinuousBooking from './pages/ContinuousBooking';
import { StateProvider } from './StateProvider';
import reducer, { initialState } from './reducer';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <StateProvider initialState={initialState} reducer={reducer}>
    <HashRouter>
        <Routes>
            <Route path = "/" element = {<Home />} />
            <Route path = "/register" element = {<Register/>} />
            <Route path="/verificationCode" element={<VerificationCode/>} />
            <Route path = "/login" element = {<Login />} />
            <Route path = "/signup" element = {<Register />} />
            <Route path = "/drive" element = {<DriverHome />} />
            <Route path = "/verify" element = {<Verification />} />
            <Route path = "/contBooking" element = {<ContinuousBooking />} />
            <Route path="/verificationCode" element={<VerificationCode/>} />
            {/* <Route path="/ride"> */}
            <Route path="/ride/:rideId" element = {<Ride />} />
            <Route path="/drive/ride/:rideId" element = {<DriverRide />} />
            {/* </Route> */}
            <Route path = "/*" element = {<h1>NOT FOUND</h1>} />
        </Routes>
    </HashRouter>
    </StateProvider>
);
