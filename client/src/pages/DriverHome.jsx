import React from 'react'
import Navbar from '../components/Navbar'
import "../styles/driverHome.css"
import { useState } from 'react'
import { useCookies } from 'react-cookie'
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import axios from 'axios'


function DriverHome() {
  const [trigger, setTrigger] = useState(false);
  const [onDuty, setOnDuty] = useState(false);
  const [cookies, setCookies] = useCookies();
  function showProfile(){
    if(trigger===true) setTrigger(false);
    else setTrigger(true);
  }
  async function toggleDuty(){
    if(onDuty===true) setOnDuty(false);
    else setOnDuty(true);
  }
  async function callMultiple(){
    setOnDuty(prev => !prev);
    console.log(onDuty);
    updateDriverCoordinates();
    // toggleDuty();
    // if(onDuty===true){
    //     setTimeout(async () => {
    //         console.log("hi")
    //         await updateDriverCoordinates();
    //     }, 1000);
    // };
  }
  async function updateDriverCoordinates(){
    const details = {
        username: cookies.userDetails.username,
        customerType: cookies.userDetails.customerType
    }
    await axios.post('/updateDriverCoordinates', details)
    .then(response => {
        console.log("Success")
    })
    .catch(error => {
      console.log(error);
    });
  }
  return (
    <>
    <div>
        <Navbar func={showProfile}/>
    </div>
    { trigger &&
        (<div className='driverProfile'>
                <div className='driverProfileClose' onClick={showProfile}>
                    <CancelIcon style={{height:"30px", width:"30px"}}/>
                </div>
                <AccountCircleIcon style={{height:"80px", width:"80px"}}/>
                <p>{cookies.userDetails.username}</p>
                <p>{cookies.userDetails.email}</p>
                <p>{cookies.userDetails.name}</p>
                <p>{cookies.userDetails.mobile}</p>
        </div>)
    }
    <div className={trigger ? 'driverHomeTrigger':'driverHome'} style={{ 
      backgroundImage: `url(${process.env.PUBLIC_URL + '/bg.jpg'})`,
      backgroundRepeat: 'no-repeat'
    }}>
        {
            trigger===false &&
            (
                <div className='activeStatus'>
                    <div>
                        <p>Will you be working today?</p>
                    </div>
                    <div>
                        <label className="switch">
                            <input type="checkbox" onClick={callMultiple}/>
                            <span className="slider"></span>
                        </label>
                    </div>
                </div>
            )
        }
    </div>
    </>
  )
}

export default DriverHome