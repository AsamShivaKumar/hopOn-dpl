import React from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter,Routes,Route,Link} from 'react-router-dom';
import Verification from './pages/Verfication';
import Home from './pages/Home';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <BrowserRouter>
        <Routes>
            <Route path = "/" element = {<Home />} />
            <Route path = "/login" element = {<h1>Login</h1>} />
            <Route path = "/signup" element = {<h1>SignUp</h1>} />
            <Route path = "/drive" element = {<h1>Driver Page</h1>} />
            <Route path = "/verify" element = {<Verification />} />
            <Route path = "/*" element = {<h1>NOT FOUND</h1>} />
        </Routes>
    </BrowserRouter>
);
