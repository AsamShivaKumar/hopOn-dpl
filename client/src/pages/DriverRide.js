import {useEffect, useState, useRef} from 'react';
import { useNavigate, useParams, Link} from 'react-router-dom';
import { useCookies } from 'react-cookie';
import { useStateValue } from '../StateProvider'

import {io} from "socket.io-client";

import tt from '@tomtom-international/web-sdk-maps';
import ttServices from "@tomtom-international/web-sdk-services";

import RequestCard from "../components/RequestCard"
import axios from 'axios';

export default function DriverRide(){
    const [{requestBasket}, dispatch] = useStateValue();
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
    const [sharing, setSharing] = useState(false);
    const [socket,setSocket] = useState(null);
    const [pickups,setPickups] = useState([]);
    const [otpDiv,setOtpDiv] = useState(false);
    const [otpVal,setOtpVal] = useState("");

    const [username,setUserName] = useState("username");
    const [loc,setLoc] = useState("location");

    const user = cookies.userDetails;

    useEffect(() => {

        if(!token) navigate("/drive");
        axios.post("https://hopnon-server.onrender.com/verify-ride-driver",{ride_id: rideId},{
            headers: {
              'Authorization': `Basic ${token}` 
            }
        }).then(res => {
            res = res.data;
            if(!res.verified) navigate("/drive");
            setRideObj(res.rideObj);
            if(res.rideObj.sharing === 0) setSharing(true);
            else setSharing(false);

            setPickups(res.rideObj.pickup.map((pickupCrd, ind) => ind));

            setSocket(io("https://hopnon-server.onrender.com"));

            navigator.geolocation.getCurrentPosition(function(position) {
                const m = tt.map({
                key: apiKey,
                container: mapContainer.current,
                center: [position.coords.longitude, position.coords.latitude],
                zoom: mapZoom
                });
                setCoords([position.coords.longitude, position.coords.latitude]);
                setMap(m);
            });
        })
    },[]);

    useEffect(() => {
        if(!map || !rideObj) return;

        let marker = new tt.Marker({
            element: new Image()
        }).setLngLat(coords);
        marker.getElement().src = "/car_top_view.png";
        marker.getElement().width = 50;
        marker.addTo(map);

        for(var i = 0; i < rideObj.pickup.length; i++){
          new tt.Marker().setLngLat(rideObj.pickup[i])
          .setPopup(new tt.Popup({offset: 30}).setHTML(rideObj.pickLoc[i]))
          .addTo(map);

          new tt.Marker().setLngLat(rideObj.drop[i])
          .setPopup(new tt.Popup({offset: 30}).setHTML(rideObj.dropLoc[i]))
          .addTo(map);

        }

        // createRoute(coords, rideObj.pickup[0]);

        navigator.geolocation.watchPosition(pos => {
          const {latitude,longitude,heading} = pos.coords;
          marker.setLngLat([longitude,latitude]);
          setCoords([longitude,latitude]);

          if(heading){
            const angle = heading - 90;
            marker.remove();
            marker = new tt.Marker({
              element: new Image(),
              rotation: angle
            }).setLngLat(coords);
            marker.getElement().src = "/car_top_view.png";
            marker.getElement().width = 50;
            marker.addTo(map);
          }
          
          findNearPickup([longitude,latitude]);
        })

    },[map,rideObj]);

    useEffect(() => {

      if(!sharing || !socket) return;
      socket.on('shared-ride-request', (ride_id, username, locs, pois, time, dist) => {
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

    },[sharing,socket])


    useEffect(() => {
      // console.log("prev", rideObj,coords);
      if(!rideObj || coords.length === 0) return;
      // console.log(rideObj.pickup,rideObj.drop);
      const locations = [coords].concat(rideObj.pickup).concat(rideObj.drop);
      createRoute(locations);
    },[rideObj,coords]);

    function displayRoute(geoJSON,instructions){
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
        }
      }

      function findNearPickup(coords){
         pickups.forEach(ind => {
          const crds = rideObj.pickup[ind];
          const dist = new tt.LngLat(crds[0],crds[1]).distanceTo(new tt.LngLat(coords[0],coords[1]));

          console.log(dist,"distance");

          if(dist < 3000){
            setUserName(rideObj.usernames[ind]);
            setLoc(rideObj.pickLoc[ind]);
            setOtpDiv(true);
          }
         })
      }
  
      function createRoute(locations){
        var routeOptions = {
          key: apiKey,
          locations: locations,
          travelMode: 'car',
          instructionsType: "text"
        }
        ttServices.services.calculateRoute(routeOptions)
        .then(res => {
          const geoJson = res.toGeoJson();
          const instructions = geoJson.features[0].properties.guidance.instructions;
          displayRoute(geoJson,instructions);
        })
      }

      function acceptRide(sh_ride_id){
        // "accept-shared-ride", (sh_ride_id,ride_id,token)
        socket.emit("accept-shared-ride", sh_ride_id,rideId,token);
        socket.on(`${user.username}-shared-ridereq-response`, (res,updRide) => {
          setRideObj(updRide);
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

      function verifyOtp(){
          const otp = otpVal;
          console.log("otp entered-", otp);
          
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
            { (sharing && requestBasket.length !== 0) && (<><div className='riderequests'>
                      {
                        requestBasket.map(ret_req_card)
                      }
                </div>
                </>)
                }
            {otpDiv && <div className='otpDiv'>
                            <div>
                              <p>{username}</p>
                              <p>{loc}</p>
                            </div>
                            <input className='otp' type="text" value = {otpVal} onChange = { (evt) => setOtpVal(evt.target.value)} placeholder='Enter OTP'/>
                            <button onClick={verifyOtp}>Submit</button>
                       </div>}
            <div ref={mapContainer} className="mapDiv"></div>
        </div>
    )
}