import React from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter,Routes,Route} from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <BrowserRouter>
        <Routes>
            <Route path = "/ride" element = {<h1>User - Home</h1>} />
            <Route path = "/login" element = {<h1>Login</h1>} />
            <Route path = "/signup" element = {<h1>SignUp</h1>} />
            <Route path = "/drive" element = {<h1>Driver Page</h1>} />
            <Route path = "/verify" element = {<h1>Driver Verification</h1>} />
            <Route path = "/*" element = {<h1>NOT FOUND</h1>} />
        </Routes>
    </BrowserRouter>
);
