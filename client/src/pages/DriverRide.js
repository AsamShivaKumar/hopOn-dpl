import {useEffect, useState, useRef} from 'react';
import { useNavigate, useParams, Link} from 'react-router-dom';
import { useCookies } from 'react-cookie';

import tt from '@tomtom-international/web-sdk-maps';
import ttServices from "@tomtom-international/web-sdk-services";

import axios from 'axios';

export default function DriverRide(){
    const mapContainer = useRef(null);
    let {rideId} = useParams();
    const navigate = useNavigate();
    const [cookies,setCookies] = useCookies();
    const token = cookies.jwtToken;
    const [rideObj,setRideObj] = useState(null);
    const [map,setMap] = useState(null);
    const [mapZoom, setMapZoom] = useState(16);
    const apiKey = "z0vcTRaQzJbXUlO6Obha1DR3tMJQFhdT";
    const [coords,setCoords] = useState([]);


    useEffect(() => {

        if(!token) navigate("/drive");
        axios.post("/verify-ride-driver",{ride_id: rideId},{
            headers: {
              'Authorization': `Basic ${token}` 
            }
        }).then(res => {
            res = res.data;
            if(!res.verified) navigate("/drive");
            setRideObj(res.rideObj);

            console.log(res.rideObj,"rideObj");

            navigator.geolocation.getCurrentPosition(function(position) {
                const m = tt.map({
                key: apiKey,
                container: mapContainer.current,
                center: [position.coords.longitude, position.coords.latitude],
                zoom: mapZoom
                });
                setCoords([position.coords.longitude, position.coords.latitude]);
                setMap(m);

                new tt.Marker().setLngLat(res.rideObj.pickup[0]).addTo(m);
                new tt.Marker().setLngLat(res.rideObj.drop[0]).addTo(m);

                // m.flyTo({center: res.rideObj.pickup});
            });
        })
    },[]);

    useEffect(() => {
        if(!map) return;

        const marker = new tt.Marker({
            element: new Image()
        }).setLngLat(coords);
        marker.getElement().src = "/car_top_view.png";
        marker.getElement().width = 50;
        marker.addTo(map);
        createRoute(coords, rideObj.pickup[0]);
    },[map]);

    function displayRoute(geoJSON){
        const layer = map.getLayer('route');
        if(layer !== undefined){
          map.getSource('route').setData(geoJSON);
        }else{
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
      }
  
      function createRoute(pickLoc,dropLoc){
        // if(pickMarker === null || dropMarker === null) return;
        const coords = [pickLoc,dropLoc];
        console.log(coords,"coords");
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
      }

    return (
        <div className='mainContainer'>
            <nav>
                <h1>HopOn</h1>
                <div>
                    <Link href="/continuous"><i className="fi fi-sr-alarm-clock" title="Continuous booking"></i></Link>
                    <Link><i className="fi fi-bs-steering-wheel" title="Rides"></i></Link>
                    <Link><i className="fi fi-sr-user" title="Profile"></i></Link>
                </div>
            </nav>
            <div ref={mapContainer} className="mapDiv"></div>
        </div>
    )
}