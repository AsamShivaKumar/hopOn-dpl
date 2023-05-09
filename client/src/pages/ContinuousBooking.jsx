import {useEffect} from 'react'
import "../styles/continuousBooking.css"
import { Link, useNavigate } from 'react-router-dom'
import { useRef } from 'react'
import { useState } from 'react'
import axios from 'axios'
import { useCookies } from 'react-cookie'


function ContinuousBooking() {
    // const username = useRef();
    const fromDate = useRef();
    const toDate = useRef();
    const optDate = useRef();
    const [cookies, setCookies] = useCookies();
    var [dates, setDates] = useState([]);
    const [monday, setMonday] = useState(false);
    const [tuesday, setTuesday] = useState(false);
    const [wednesday, setWednesday] = useState(false);
    const [thursday, setThursday] = useState(false);
    const [friday, setFriday] = useState(false);
    const [saturday, setSaturday] = useState(false);
    const [sunday, setSunday] = useState(false);

    const navigate = useNavigate();


    function mon(){
        setMonday(prev => !prev);
    }
    function tues(){
        setTuesday(prev => !prev);
    }
    function wednes(){
        setWednesday(prev => !prev);
    }
    function thurs(){
        setThursday(prev => !prev);
    }
    function fri(){
        setFriday(prev => !prev);
    }
    function satur(){
        setSaturday(prev => !prev);
    }
    function sun(){
        setSunday(prev => !prev);
    }
    const handleSubmit = async (e) => {
        e.preventDefault();
        // console.log(monday.current.value + " " + fromDate.current.value + " " + toDate.current.value );
        const weekdays = []
        monday && weekdays.push(1)
        tuesday && weekdays.push(2)
        wednesday && weekdays.push(3)
        thursday && weekdays.push(4)
        friday && weekdays.push(5)
        saturday && weekdays.push(6)
        sunday && weekdays.push(0)
        const details = {
            username: cookies.userDetails.username,
            dates: dates,
            fromDate: fromDate.current.value,
            toDate: toDate.current.value,
            weekdays: weekdays,
            locs: cookies.rideLoc.locs
          }
          setCookies("bookingDetails", details, {path : "/"})
          axios.post('https://hopnon-server.onrender.com/continuousbooking', details)
            .then(response => {
                console.log(response);
                navigate("/");
            })
            .catch(error => {
            console.log(error);
            });
    }
    const addDate = async (e) => {
        setDates( dates => [...dates, optDate.current.value])
    }

    useEffect(() => {
        if(!cookies.rideLoc) navigate("/");
    },[]);


  return (
    <div className='continuousBooking' style={{ 
        backgroundImage: `url(${process.env.PUBLIC_URL + '/bg.jpg'})`,
        backgroundRepeat: 'no-repeat'
      }}>
      <div className='cont_logo'>
            <h1>HopOn</h1>
        </div>
        <div className='cont_booking_form'>
            <form className="form" >
                <div className='cont__form__title'>
                  Continuous Booking
                </div>
                {/* <div className="cont__form__element">
                    <input ref={username} type="text" placeholder='username' required/>
                </div> */}
                <div className="cont__form__element">
                    <div className='from_date'>
                        <p>From Date </p>
                        <input ref={fromDate} type="date" required/>
                    </div>
                    <div className='to_date'>
                        <p>To Date</p>
                        <input ref={toDate} type="date" required/>
                    </div>
                </div>
                <div style={{marginTop: '20px'}}>
                    <p>Which of the weekdays should be excluded?</p>
                </div>
                <div className='weekdays'>
                    <label><input type='checkbox' onChange={mon} value='Monday' /> Monday </label>
                    <label><input type='checkbox' onChange={tues} value='Tuesday' /> Tuesday </label>
                    <label><input type='checkbox' onChange={wednes} value='Wednesday' /> Wednesday </label>
                    <label><input type='checkbox' onChange={thurs} value='Thursday' /> Thursday </label>
                    <label><input type='checkbox' onChange={fri} value='Friday' /> Friday </label>
                    <label><input type='checkbox' onChange={satur} value='Saturday' /> Saturday </label>
                    <label><input type='checkbox' onChange={sun} value='Sunday' /> Sunday </label>
                </div>
                <div style={{marginTop: '20px'}}>
                    <p>Select specific dates to be excluded if any</p>
                </div>
                <div className='cont__form__element'>
                    <div className='optDates'>
                        {
                            dates.map((item) => <div> {item} </div>)
                        }
                    </div>
                    <input ref={optDate} type="date" onChange={addDate} required/>
                </div>
                <div onClick={handleSubmit}>
                    <input type='submit' value='Submit'/>
                </div>

                <Link to="/" className='redirectRiderHome'>
                      <div>
                        Return back to Home Page?
                      </div>
                </Link>
            </form>
        </div>
        
    </div>
  )
}

export default ContinuousBooking