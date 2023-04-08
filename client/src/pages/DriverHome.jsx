import React, { useEffect } from 'react'
import Navbar from '../components/Navbar'
import "../styles/driverHome.css"
import { useState, useRef } from 'react'
import { useCookies } from 'react-cookie'
import tt from '@tomtom-international/web-sdk-maps';
import ttServices from "@tomtom-international/web-sdk-services";
import {io} from "socket.io-client";
import axios from 'axios'


function DriverHome() {
  const [trigger, setTrigger] = useState(false);
  const [onDuty, setOnDuty] = useState(false);
  const [map, setMap] = useState(null);
  const mapContainer = useRef(null);
  const [cookies, setCookies] = useCookies();
  const apiKey = "z0vcTRaQzJbXUlO6Obha1DR3tMJQFhdT";
  const [mapZoom, setMapZoom] = useState(16);
  const [marker,setMarker] = useState(null);
  
  
  
  // use useEffect and allow only the users who are drivers ************
  
  useEffect(() => {
    if(trigger === false) return;
    navigator.geolocation.getCurrentPosition(function(position) {
      const coords = [position.coords.longitude, position.coords.latitude];
      const m = tt.map({
      key: apiKey,
      container: mapContainer.current,
      center: coords,
      zoom: mapZoom
      });
      setMap(m);
      const mrkr = new tt.Marker({
        element: new Image()
      }).setLngLat(coords);
      mrkr.getElement().src = "car_top_view.png";
      mrkr.getElement().width = 50;
      mrkr.addTo(m);
      setMarker(mrkr);
    });
  },[trigger]);

  useEffect(() => {
    if(map === null) return;

    const socket = io("http://localhost:4000");
    
    navigator.geolocation.watchPosition((pos => {
      const {heading, latitude, longitude} = pos.coords;

      ttServices.services.reverseGeocode({
        key: apiKey,
        position: [longitude,latitude]
      })
      .then(res => {
        const loc = res.addresses[0].address.municipality;
        socket.emit("driver-coords",cookies.userDetails.username,loc,{latitude,longitude,heading});
      })
      .catch(err => console.log(err));

      marker.setLngLat([longitude,latitude]);
      map.flyTo({center: [longitude,latitude]});
    }))

    socket.on('ride-request', (ride_id, username, locs, pois) => {
      console.log("ride details-",ride_id, username, locs, pois);
    });

  },[map]);


  function showProfile(){
    if(trigger===true) setTrigger(false);
    else setTrigger(true);
  }
  
  
  return (
    <>
    <div>
        <Navbar func={showProfile}/>
    </div>
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
                            <input type="checkbox" onClick={() => setTrigger(true)}/>
                            <span className="slider"></span>
                        </label>
                    </div>
                </div>
            )
        }
    </div>
    <div ref={mapContainer} className="mapDiv"></div>
    </>
  )
}

export default DriverHome