import React, { useState } from 'react'
import { useRef} from 'react'
import { Link, useNavigate } from 'react-router-dom';
import "../styles/register.css"
import axios from 'axios';
import { useCookies } from 'react-cookie';

function Register() {

  const name = useRef()
  const email = useRef()
  const userName = useRef()
  const password = useRef() 
  const mobile = useRef()

  const navigate = useNavigate();

  const [cookies, setCookies] = useCookies()

  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    // console.log(userName.current.value + " " + name.current.value + " " + email.current.value + " " + mobile.current.value + " " + password.current.value);
  }

  const handleDriver = async (e) => {
      const details = {
        username: userName.current.value,
        name: name.current.value,
        email: email.current.value,
        mobile: mobile.current.value,
        password: password.current.value,
        customerType: "Driver"
      }
      setCookies("userDetails", details, {path : "/"})
      await axios.post('https://hopnon-server.onrender.com/register', details)
    .then(response => {
      if(response.data.success===true){
        navigate("/login");
      }else{
        setMsg(response.data.msg)
      }
    })
    .catch(error => {
      console.log(error);
    });
  }

  const handleRider = async (e) => {
      const details = {
        username: userName.current.value,
        name: name.current.value,
        email: email.current.value,
        mobile: mobile.current.value,
        password: password.current.value,
        customerType: "Rider"
      }
      setCookies("userDetails", details, {path : "/"})
      await axios.post('https://hopnon-server.onrender.com/register', details)
    .then(response => {
      if(response.data.success===true){
          navigate("/login");
      }else{
        setMsg(response.data.msg)
      }
    })
    .catch(error => {
      console.log(error);
    });
  }

  return (
    <div className='register' style={{ 
      backgroundImage: `url(${process.env.PUBLIC_URL + '/bg.jpg'})`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover'
    }}>
        <div className='register__logo'>
            <h1>HopOn</h1>
        </div>
        <div className='reg-msg'>
            {msg}
        </div>
        <div className='register__form'>
            <form className="form" onSubmit={handleSubmit}>
                <div className='register__form__title'>

                  Register
                </div>
                <div className='register__form__element username'>
                        <input ref={userName} type="text" placeholder='Username' required/>
                </div>
                <div className="register__form__element name">
                    <input ref={name} type="text" placeholder='Name' required/>
                </div>
                <div className="register__form__element email">
                    <input ref={email} type="email" placeholder='Email address' required/>
                </div>
                <div className="register__form__element mobile">
                    <input ref={mobile} type="tel" placeholder='Mobile Number' required/>
                </div>
                <div className="register__form__element password">
                    <input ref={password} type="password" placeholder='Password' pattern="^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[a-zA-Z!#$%&? ])[a-zA-Z0-9!#$%&?]{8,20}$" required/>
                </div>
                <div className='register__form__element register__buttons'>
                    <input type="submit" value="Register as Rider" onClick={handleRider}/>
                    <input type="submit" value="Register as Driver" onClick={handleDriver}/>
                </div>
                <Link to="/" className='redirect__login'>
                      <div>
                        Return back to Login Page?
                      </div>
                </Link>
            </form>
        </div>
    </div>
  )
}

export default Register