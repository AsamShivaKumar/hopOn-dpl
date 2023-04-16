import React, { useEffect } from 'react'
import Navbar from '../components/Navbar'
import "../styles/driverHome.css"
import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCookies } from 'react-cookie'
import tt from '@tomtom-international/web-sdk-maps';
import ttServices from "@tomtom-international/web-sdk-services";
import {io} from "socket.io-client";
import RequestCard from "../components/RequestCard"
import { useStateValue } from '../StateProvider'
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CancelIcon from '@mui/icons-material/Cancel';


function DriverHome() {
  const [{requestBasket}, dispatch] = useStateValue();
  const [trigger, setTrigger] = useState(false);
  const [onDuty, setOnDuty] = useState(false);
  const [map, setMap] = useState(null);
  const mapContainer = useRef(null);
  const [cookies, setCookies] = useCookies();
  const apiKey = "z0vcTRaQzJbXUlO6Obha1DR3tMJQFhdT";
  const [mapZoom, setMapZoom] = useState(16);
  const [marker,setMarker] = useState(null);
  const [coords,setCoords] = useState([]);
  const [loc,setLoc] = useState("");
  const [rideAccepted, setRideAccepted] = useState(false);

  const navigate = useNavigate();
  const driverDetails = cookies.userDetails;
  const token = cookies.jwtToken;
  
  const socket = io("http://localhost:4000");
  
  // use useEffect and allow only the users who are drivers ************
  
  // useEffect(() => {
  //   if(trigger === false) return;
  //   navigator.geolocation.getCurrentPosition(function(position) {
  //     const coords = [position.coords.longitude, position.coords.latitude];
  //     const m = tt.map({
  //     key: apiKey,
  //     container: mapContainer.current,
  //     center: coords,
  //     zoom: mapZoom
  //     });
  //     setMap(m);
  //     const mrkr = new tt.Marker({
  //       element: new Image()
  //     }).setLngLat(coords);
  //     mrkr.getElement().src = "car_top_view.png";
  //     mrkr.getElement().width = 50;
  //     mrkr.addTo(m);
  //     setMarker(mrkr);
  //   });
  // },[trigger]);

  useEffect(() => {
    if(!onDuty) return;

    const socket = io("https://hopnon-server.onrender.com");
    
    navigator.geolocation.watchPosition((pos => {
        const {heading, latitude, longitude} = pos.coords;
        reverseGeocode(longitude,latitude,heading);
        // marker.setLngLat([longitude,latitude]);
        setCoords([longitude,latitude]);
        // map.flyTo({center: [longitude,latitude]});
    }))

    socket.on('ride-request', (ride_id, username, locs, pois, time, dist) => {
      console.log("ride details-",ride_id, username, locs, pois, time, dist);
      const rideDetails = {
        ride_id: ride_id,
        username: username,
        locs: locs,
        pois: pois,
        distance: dist
      }
      setCookies("rideDetails", rideDetails, {path : "/"})
      dispatch({
        type: 'ADD',
        item: rideDetails
      })
    });

  },[onDuty]);

  useEffect(() => {
    if(loc === "") return;
    socket.on(`send-coords-${loc}`, () => {
      socket.emit("driver-coords", cookies.userDetails.username,loc,{latitude: coords[1],longitude:coords[0],heading:null})
    })
  },[loc]);

  function reverseGeocode(longitude,latitude,heading){
    ttServices.services.reverseGeocode({
      key: apiKey,
      position: [longitude,latitude]
    })
    .then(res => {
      setLoc(res.addresses[0].address.municipality);
      socket.emit("driver-coords",cookies.userDetails.username,res.addresses[0].address.municipality,{latitude,longitude,heading});
    })
    .catch(err => console.log(err));
  }


  function showProfile(){
    if(trigger===true) setTrigger(false);
    else setTrigger(true);
  }

  function toggleDuty(){
    if(onDuty===true) setOnDuty(false);
    else setOnDuty(true);
  }

  function acceptRide(ride_id){
    console.log("accpeting ride!!!",socket);

    socket.emit('accept-ride', ride_id,token);
    
    socket.on(`${driverDetails.username}-ridereq-response`, (res) => {
      if(res) navigate(`ride/${ride_id}`);
      else console.log("Ride has already been alloted to other driver!");
    })
  }

  function ret_req_card(props){
    // const dist = distance(props.locs[0][0], props.locs[0][1], props.locs[1][0], props.locs[1][1], "K")
    return (
          <RequestCard
              ride_id={props.ride_id}
              username={props.username}
              pick_up={props.pois[0]}
              drop={props.pois[1]}
              distance={props.distance}
              func={acceptRide}
          />
    )
  }

  function func(){
    setRideAccepted(prev => !prev);
  }
  
  
  return (
    <>
    <div>
    <Navbar func={showProfile}/>
       {/* <nav>
        <h1>HopOn</h1>
        <div>
        <Link href="/continuous"><i className="fi fi-sr-alarm-clock" title="Continuous booking"></i></Link>
        <Link><i className="fi fi-bs-steering-wheel" title="Rides"></i></Link>
        <Link><i className="fi fi-sr-user" title="Profile"></i></Link>
        </div>
       </nav> */}
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
            (<>
                <div className='activeStatus'>
                    <div>
                        <p>Will you be working today?</p>
                    </div>
                    <div>
                        <label className="switch">
                            <input type="checkbox" onClick={() => setOnDuty(true)}/>
                            <span className="slider"></span>
                        </label>
                    </div>
                </div>
                { (onDuty===true && requestBasket.length !== 0) && (<><div className='riderequests'>
                      {
                        requestBasket.map(ret_req_card)
                      }
                </div>
                </>)
                }

                </>)
        }
    </div>

    </>
  )
}

export default DriverHome