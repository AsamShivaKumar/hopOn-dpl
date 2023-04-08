import React, { useEffect } from 'react'
import { useRef } from 'react'
import { Link } from 'react-router-dom';
import "../styles/login.css"
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { useCookies } from 'react-cookie';
import { useState } from 'react';

function Login() {
  const [cookies, setCookies] = useCookies()
  const [msg, setmsg] = useState("")
  
  const userNameOrEmail = useRef()
  const password = useRef()
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
        e.preventDefault();
        // console.log(userNameorEmail.current.value + " " + password.current.value);
  }

  useEffect(() => {
    if(cookies.jwtToken) navigate("/");
  },[]);

  const handleRider = async (e) => {
      await axios.post('/login', {
        usernameoremail: userNameOrEmail.current.value,
        password: password.current.value,
        customerType: "Rider"
      })
      .then(res => {
        res = res.data;
        console.log(res,"data");
        if(res.success===true){
            setCookies("userDetails",{username: res.username,customerType: res.customerType,emailVerified: res.emailVerified},{path: "/"});
            setCookies("jwtToken",res.token,{path: "/"});
            if(res.emailVerified === false){
              navigate("/verificationCode")
            }else navigate("/")
        }else setmsg(res.msg)
      })
      .catch(error => {
        console.log(error);
      });
  }

  const handleDriver = async (e) => {
      await axios.post('/login', {
      usernameoremail: userNameOrEmail.current.value,
      password: password.current.value,
      customerType: "Driver"
      })
      .then(response => {
        if(response.data.success===true){
            if(response.data.emailVerified===false){
                setCookies("userDetails",response.data, {path: "/"})
                navigate("/verificationCode")
            }else{
                navigate("/driverHome")
            }
        }else{
          setmsg(response.data.msg)
        }
      })
      .catch(error => {
        console.log(error);
      });
  }

  return (
    <div className='login' style={{ 
      backgroundImage: `url(${process.env.PUBLIC_URL + '/bg.jpg'})`,
      backgroundRepeat: 'no-repeat'
    }}>
        <div className='login__logo'>
            <h1>HopOn</h1>
        </div>
        <div className='log-msg'>
                {msg}
        </div>
        <div className='login__form'>
            
            <form className="form" onSubmit={handleSubmit}>
                <div className='form__title'>
                  Login
                </div>
                <div className='form__element username__email'>
                        <input ref={userNameOrEmail} type="text" placeholder='Username or Email address' required/>
                </div>
                <div className="form__element password">
                    <input ref={password} type="password" placeholder='Password' required/>
                </div>
                <div className='form__element login__buttons'>
                    <input type="submit" value="Login as Rider" onClick={handleRider}/>
                    <input type="submit" value="Login as Driver" onClick={handleDriver}/>
                </div> 
                <Link to="/register" className='redirect__register'>
                  <div>
                    Don't you have an account?
                  </div>
                </Link>
            </form>
        </div>
    </div>
  )
}

export default Login