import { useEffect, useState, useRef } from 'react';
import { useCookies } from 'react-cookie';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {io} from "socket.io-client";
import tt from '@tomtom-international/web-sdk-maps';
import ttServices from "@tomtom-international/web-sdk-services";
import axios from 'axios';

import "../styles/ride.css";
import DriverHome from './DriverHome';


export default function Ride(){
    let {rideId} = useParams();
    const [cookies, setCookies] = useCookies();
    const navigate = useNavigate();
    const mapContainer = useRef(null);
    const apiKey = "z0vcTRaQzJbXUlO6Obha1DR3tMJQFhdT";
    const [map, setMap] = useState(null);
    const [rideObj,setRideObj] = useState({});
    const [mapLong, setMapLong] = useState(86);
    const [mapLat, setMapLat] = useState(-45);
    const [mapZoom, setMapZoom] = useState(16);
    const [driverAss, setDriverAss] = useState(false);
    const [driverObj,setDriverObj] = useState({
      username: "name",
      mobile: "6864394678",
      reg_no: "number"
    });
    const [ind,setInd] = useState(0);

    const token = cookies.jwtToken;

    useEffect(() => {
        
      axios.post("https://hopnon-server.onrender.com/verify-ride-user",{ride_id: rideId},{
        headers: {
          'Authorization': `Basic ${token}`
        }
       }).then(res => {
          res = res.data;
          console.log(res,"response from server!!");
          if(!res.verified) navigate("/");
          setRideObj(res.rideObj);
          const i = res.rideObj.usernames.indexOf(cookies.userDetails.username);
          setInd(i);
          console.log("here!");
          console.log(res.rideObj,i);
          // console.log(res.rideObj.pickup[i]);

          if(res.rideObj.driver){
            setDriverAss(true);
            console.log("assigned!")
            setDriverObj({
              username: res.rideObj.driver,
              mobile: res.rideObj.mobile,
              reg_no: res.rideObj.reg_no
            })
          }
          
       })
    },[])

    useEffect(() => {
      if(rideObj === {}) return;

      const socket = io("https://hopnon-server.onrender.com");

        navigator.geolocation.getCurrentPosition(function(position) {
            setMapLat(position.coords.latitude);
            setMapLong(position.coords.longitude);
            const m = tt.map({
            key: apiKey,
            container: mapContainer.current,
            center: [position.coords.longitude, position.coords.latitude],
            zoom: mapZoom
            });
            setMap(m);

            console.log(ind)
            console.log(rideObj.pickup[ind],"pickup");
            console.log(rideObj.drop[ind],"drop");

            new tt.Marker().setLngLat(rideObj.pickup[ind]).addTo(m);
            new tt.Marker().setLngLat(rideObj.drop[ind]).addTo(m);

            console.log(`${rideId}-accepted`);
            socket.on(`${rideId}-accepted`, (driver) => {
              console.log("driverObj",driver);
              setDriverObj(driver);              
              setDriverAss(true);
            })

            m.flyTo({center: rideObj.pickup[ind]});
      });

    },[rideObj])

    useEffect(() => {
        if(map === null || rideObj === {}) return;

        const coords = [rideObj.pickup[ind],rideObj.drop[ind]]
        var routeOptions = {
            key: apiKey,
            locations: coords,
            travelMode: 'car'
        }
        ttServices.services.calculateRoute(routeOptions)
        .then(res => {
            const geoJson = res.toGeoJson();
            displayRoute(geoJson);
        })

    },[map,rideObj]);

    function displayRoute(geoJSON){

          map.addLayer({
            'id': 'route',
            'type': 'line',
            'source': {
              'type': 'geojson',
              'data': geoJSON
            },
            'paint': {
              'line-color': 'black',
              'line-width': 3
            }
          });
        //   setTimeout(() => map.flyTo({center: pickMarker.getLngLat()}),1000); 
      }

    return (
        <div className='mainContainer'>
            <nav>
              <h1>HopOn</h1>
              <div>
                <Link href="/continuous"><i className="fi fi-sr-alarm-clock" alt="continuous booking"></i></Link>
                <Link href="/scheduled-rides"><i className="fi fi-sr-calendar-clock" alt="Scheduled rides"></i></Link>
                <Link href="/profile"><i className="fi fi-sr-user" alt="Profile"></i></Link>
              </div>
             </nav>
             <div className='pickDrop'>
                <p className="searchInput">{rideObj.pickLoc? rideObj.pickLoc[ind] : 0}</p>
                <p className="searchInput">{rideObj.dropLoc? rideObj.dropLoc[ind] : 0}</p>
                
                {!driverAss && <figure>
                                <img className="loadingGif" src = '/dring.gif'/>
                                <figcaption> Searching for drivers...</figcaption>
                               </figure>}
                {driverAss && rideObj && <div className='driverDetails'>
                                   <div>
                                      <p>{driverObj.username}</p>
                                      <p>{driverObj.reg_no}</p>
                                      <p>{driverObj.mobile}</p>
                                   </div>
                                   <div>
                                      <p>OTP</p>
                                      <p>{rideObj.otp? rideObj.otp[ind]:0}</p>
                                   </div>
                              </div>}
             </div>
            <div ref={mapContainer} className="mapDiv"></div>
        </div>
    )
}