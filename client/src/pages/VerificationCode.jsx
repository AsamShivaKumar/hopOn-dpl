import React from 'react'
import "../styles/verificationCode.css"
import { useCookies } from 'react-cookie';
import { useRef } from 'react';
import axios from 'axios'
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

function VerificationCode() {
    const navigate = useNavigate();
    const [cookies, setCookies] = useCookies();
    const [msg, setMsg] = useState("")
    const enteredCode = useRef();
    const handleSubmit = (e) => {
        e.preventDefault();
        axios.post('/verificationCode', {
        code: cookies.userDetails.code,
        username: cookies.userDetails.username,
        customerType: cookies.userDetails.customerType,
        enteredCode: enteredCode.current.value
      })
      .then(response => {
            if(response.data.success===true){
                if(cookies.customerType === "Driver") navigate("/drive");
                else navigate("/");
            }else{
              setMsg(response.data.msg);
            }
      })
      .catch(error => {
        console.log(error);
      });
    }
    return (
      <div className='verificationCode' style={{ 
        backgroundImage: `url(${process.env.PUBLIC_URL + '/bg.jpg'})`,
        backgroundRepeat: 'no-repeat'
      }}>
          <div className='verification__logo'>
              <h1>HopOn</h1>
          </div>
          <div className='ver-msg'>
              {msg}
          </div>
          <div className='form-wrapper'>
            <form className='verificationForm' onSubmit={handleSubmit}>
                <label htmlFor="vc">Enter the verification code sent to your email. </label>
                <input ref={enteredCode} type="number" name="vc" required/>
                <input type="submit" value="Verify Email" />
            </form>
          </div>
      </div>
    )
}

export default VerificationCode