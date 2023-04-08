import { useEffect, useState, useRef } from 'react';
import { useCookies } from 'react-cookie';
import { useNavigate, useParams, Link } from 'react-router-dom';
import tt from '@tomtom-international/web-sdk-maps';
import ttServices from "@tomtom-international/web-sdk-services";

import "../styles/ride.css";


export default function Ride(){
    let {rideId} = useParams();
    const [cookies, setCookies] = useCookies();
    const navigate = useNavigate();
    const rideObj = cookies.rides[rideId];
    const mapContainer = useRef(null);
    const apiKey = "z0vcTRaQzJbXUlO6Obha1DR3tMJQFhdT";
    const [map, setMap] = useState(null);
    const [mapLong, setMapLong] = useState(86);
    const [mapLat, setMapLat] = useState(-45);
    const [mapZoom, setMapZoom] = useState(16);

    useEffect(() => {
        if(!rideObj) navigate("/");

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
        });

    },[])

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
                <p className="searchInput">{rideObj.pickLoc}</p>
                <p className="searchInput">{rideObj.dropLoc}</p>
             </div>
            <div ref={mapContainer} className="mapDiv"></div>
        </div>
    )
}