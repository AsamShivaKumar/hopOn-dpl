import React, { useState, useEffect, useRef } from 'react';
import { useCookies } from 'react-cookie';
import {Link, useNavigate} from 'react-router-dom';
import '@tomtom-international/web-sdk-maps/dist/maps.css';
import tt from '@tomtom-international/web-sdk-maps';
import ttServices from "@tomtom-international/web-sdk-services";
import DropDown from '../components/DropDown';
import DatePicker from '../components/DatePicker';
import RideList from '../components/RideList';
import axios from "axios";
import {io} from "socket.io-client";

import '../styles/home.css';

export default function Home(){

    const navigate = useNavigate();
    const mapContainer = useRef(null);
    const [mapLong, setMapLong] = useState(86);
    const [mapLat, setMapLat] = useState(-45);
    const [mapZoom, setMapZoom] = useState(16);
    const [map, setMap] = useState(null);
    const [userLocation,setUserLocation] = useState("");
    const apiKey = "z0vcTRaQzJbXUlO6Obha1DR3tMJQFhdT";
    const [suggestions,setSuggestions] = useState([]);
    const [pickLoc,setPickLoc] = useState("");
    const [dropLoc,setDropLoc] = useState("");
    const [pick,setPick] = useState(true);
    const [dropMarker,setDropMarker] = useState(null)
    const [pickMarker,setPickMarker] = useState(null);
    const [locs,setLocs] = useState([0,0]);
    const [center,setCenter] = useState(true);
    const [schedule,setSchedule] = useState(false);
    const [date,setDate] = useState(null);
    const [time,setTime] = useState("");
    const [travelTime, setTravelTime] = useState(0);
    const [dist,setDist] = useState(0);
    const [book,setBook] = useState(false);
    const [comf, setComf] = useState(false);
    const rideShareDiv = useRef(null);
    const [msg,setMsg] = useState("");
    const [rideList,setRideList] = useState([]);
    const [showRideList,setShowRideList] = useState(true);
    const [cookies, setCookies] = useCookies();
    
    const socket = io("http://localhost:4000");
    const token = cookies.jwtToken;
    const user = cookies.userDetails;

    const driver_data = new Map();
    let car_markers = new Map();

    useEffect(() => {
      
      if(token === undefined) navigate("/login");
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

      return () => {if(map != null) map.remove()};
    },[]);

    useEffect(() => {
      if(map !== null && driver_data.size === 0){
        ttServices.services.reverseGeocode({
          key: apiKey,
          position: [mapLong, mapLat],
        }).then(res => {
           setUserLocation(res.addresses[0].address.municipality);

           // fetch driver coords in the same location
           axios.get("/get-driver-coords",{
              params: {location: res.addresses[0].address.municipality}
           }).then(res => {
            const dr_details = res.data.driver_details;
            for(var i = 0; i < dr_details.length; i++)
              driver_data.set(dr_details[i].username,dr_details[i].coords);
            updateCarMarkers();
          });
        });
      }
        
    },[map]);

    useEffect(() => {
      if(userLocation !== ""){
        socket.on(`rider-${userLocation}`, (user_name,location,coords) => {
          console.log("Info received -",user_name,location,coords);
        })
      }
    },[userLocation]);

    useEffect(() => {
      if(pickMarker !== null){
        pickMarker.on('dragend',(evt) => {
          const lngLat = evt.target.getLngLat();
          pickMarker.setLngLat([lngLat.lng,lngLat.lat]);
          setCenter(true);
          setLocs(prevLocs => [[lngLat.lng,lngLat.lat],prevLocs[1]]);
          // reverseGeocode(lngLat.lng,lngLat.lat)
          // .then(res => console.log(res,"result"))
          // console.log(res,"Result")
        });
      }
    },[pickMarker]);

    useEffect(() => {
      if(dropMarker !== null){
        dropMarker.on('dragend',(evt) => {
          const lngLat = evt.target.getLngLat();
          dropMarker.setLngLat([lngLat.lng,lngLat.lat]);
          setLocs(prevLocs => [prevLocs[0],[lngLat.lng,lngLat.lat]]);
          setCenter(false);
        });
      }
    },[dropMarker]);

    // updating the pick & drop locations
    useEffect(() => {
      if(locs[0] !== 0 && locs[1] !== 0) createRoute(locs[0],locs[1]);
    },[locs]);

    // updating driver coords
    function updateCarMarkers(){
      for(const [username, coords] of driver_data){
        let marker = car_markers.get(username);
        if(marker) marker.setLngLat(coords);
        else {
          marker = new tt.Marker({
            element: new Image()
          }).setLngLat(coords);
          marker.getElement().src = "car_top_view.png";
          marker.getElement().width = 50;
          marker.addTo(map);
          car_markers.set(username,marker);
        }
      }

      // removing car markers which are away from location
      for(const [username, marker] of car_markers){
        if(!driver_data.get(username)){
          marker.remove();
          car_markers.delete(username);
        }
      }
    }

    const fuzzySearch = (evt) => {
      const query = evt.target.value;
      if(evt.target.getAttribute("name") === "pickup") setPickLoc(query);
      else setDropLoc(query);

      if(query.length < 4) return;
      const radius = 10000;
      const limit = 5;

      ttServices.services.fuzzySearch({
        key: apiKey,
        query: query,
        center: {longitude: mapLong, latitude: mapLat},
        radius: radius,
        limit: limit,
        idxSet: 'POI'
      })
      .then(res => {
        setSuggestions(res.results);
        if(evt.target.getAttribute("name") === "pickup") setPick(true);
        else setPick(false);
      }).catch(err => console.log("Error!"));
    };

    function pointLocation(latPos,longPos,locName){

      if(pick === true) setPickLoc(locName);
      else setDropLoc(locName);

      map.flyTo({center: [longPos,latPos]});
      if(pick === true){        
        if(pickMarker === null){
          const marker = new tt.Marker({
            draggable: true
          }).setLngLat([longPos,latPos]).addTo(map);
          setPickMarker(marker);
          setLocs(prevLocs => [[longPos,latPos],prevLocs[1]]);
        }else{
          setLocs(prevLocs => [[longPos,latPos],prevLocs[1]]);
          pickMarker.setLngLat([longPos,latPos]);
        }
      }else{
        if(dropMarker === null){
          const marker = new tt.Marker({
            draggable: true
          }).setLngLat([longPos,latPos]).addTo(map);
          setDropMarker(marker);
          setLocs(prevLocs => [prevLocs[0],[longPos,latPos]]);
        }else{
          setLocs(prevLocs => [prevLocs[0],[longPos,latPos]]);
          dropMarker.setLngLat([longPos,latPos]);
        }
      }
      setSuggestions([]);
    }

    function displayRoute(geoJSON){
      const layer = map.getLayer('route');
      if(layer !== undefined){
        map.getSource('route').setData(geoJSON);
        if(center === true) map.flyTo({center: pickMarker.getLngLat()});
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
        setTimeout(() => map.flyTo({center: pickMarker.getLngLat()}),1000); 
      }
    }

    function createRoute(pickLoc,dropLoc){
      // if(pickMarker === null || dropMarker === null) return;
      const coords = [pickLoc,dropLoc];
      var routeOptions = {
        key: apiKey,
        locations: coords,
        travelMode: 'car'
      }
      ttServices.services.calculateRoute(routeOptions)
      .then(res => {
        const geoJson = res.toGeoJson();
        setDist(geoJson.features[0].properties.summary.lengthInMeters);
        setTravelTime(geoJson.features[0].properties.summary.travelTimeInSeconds);
        displayRoute(geoJson);
      })
    }

    async function reverseGeocode(longitude,latitude){
      // console.log(ttServices.services.poiService());
      const res = await ttServices.services.reverseGeocode({
        key: apiKey,
        position: [longitude,latitude]
      })
      console.log(res.addresses[0]);
      return res.addresses[0].address.municipality;
    }

    function openScheduleDiv(){
      if(pickMarker !== null && dropMarker !== null) setSchedule(true);
      else{
        if(pickMarker === null) setMsg("Select pickup location!");
        else setMsg("Select drop location!");

        setInterval(() => setMsg(""),7000);
      }
    }

    function scheduleRide(){
      if(date === null || time === ""){
        if(date === null) setMsg("Select date!");
        else setMsg("Select time!");

        setInterval(() => setMsg(""), 7000);
        return;
      }

      // axios req to server to schedule the ride
      const reqObj = {locs: locs,location: userLocation, travelTime: travelTime, dist: dist, pois: [pickLoc,dropLoc], date: date, time: time};
      axios.post("/schedule-ride",reqObj,{
        headers: {
          'Authorization': `Basic ${token}` 
        }
      })
      .then(res =>{
        res = res.data;
        const rideObj = res.rideObj;
        let scheduledRides = cookies.scheduledRides;
        if(!scheduledRides) scheduledRides = {};

        scheduledRides[rideObj._id] = rideObj;
        setCookies('scheduledRides',scheduledRides);
      })
      
      dropMarker.remove();
      pickMarker.remove();
      // map.removeLayer('route');
      setDropLoc("");
      setPickLoc("");
      setLocs([0,0]);
      setDropMarker(null);
      setPickMarker(null);

      setSchedule(false);
    }

    function bookRide(evt){
      if(pickMarker === null || dropMarker === null){
        if(pickMarker === null) setMsg("Select pickup location!");
        else setMsg("Select drop location!");

        setInterval(() => setMsg(""), 7000);
        evt.target.value = "none";
        return;
      }

      if(evt.target.value === 'none') return;
      else if(evt.target.value === 'Book Now') rideShareDiv.current.style.transform = "translateY(240px)";
      else{
        // req for ride share
        return;
      }
    }

    function bookNow(sharing){
      // if(sharing)

      const otp = Math.round(Math.random()*(10000 - 999)) + 1000;
      // request to server with {locs,otp,username,location} - use socket ==> at server, invoke an event to all drivers in that location
      // ==> at driver side, receive th event and display the request in the request bar
      // if a driver approves a ride, trigger evt to server ==> event on this page ==> ride starts after otp verification
      const reqObj = {locs: locs,otp: otp,token: token,location: userLocation, time: travelTime, dist: dist, pois: [pickLoc,dropLoc]};
      socket.emit("ride-request",reqObj);
      socket.on(`ride-res-${user.username}`, (rideObj) => {
        let rides = cookies.rides;
        if(!rides) rides = {};
        rides[rideObj._id] = rideObj;
        setCookies('rides',rides);
        navigate(`ride/${rideObj._id}`);
      })
    }

    function showOrHideRideList(){
      if(!cookies.rides){
        setMsg("No scheduled or active rides!!")
        setInterval(() => setMsg(""),6000);
        return;
      }
      if(showRideList) setRideList(Object.values(cookies.rides))
      else setRideList([])
      setShowRideList(!showRideList);
    }

    return (
    <>
        <div className='mainContainer'>
             <nav>
              <h1>HopOn</h1>
              <div>
                <Link href="/continuous"><i className="fi fi-sr-alarm-clock" title="Continuous booking"></i></Link>
                <Link><i className="fi fi-bs-steering-wheel" title="Rides" onClick={showOrHideRideList}></i></Link>
                <Link><i className="fi fi-sr-user" title="Profile"></i></Link>
              </div>
             </nav>
             {!schedule && 
             <div className='searchBox'>
                <h1>From here to there, we'll get you anywhere!</h1>
                <input className="searchInput from" type="text" onChange = { fuzzySearch } placeholder="Enter pickup" name="pickup" value = {pickLoc} />
                <input className="searchInput to" type="text" onChange = { fuzzySearch } placeholder="Enter drop" name="drop" value = {dropLoc} />
                <div className='bookingBtnDiv'>
                  <select name="mode" className='searchBtn' onChange={(evt) => bookRide(evt)}>
                    <option value="none" selected disabled hidden>Select mode</option>
                    <option value="Book Now">Book Now</option>
                    <option value="Share Ride">Share Ride</option>
                  </select>
                  {/* <button className="searchBtn" onClick={bookNow}>Book Now</button> */}
                  <button className="searchBtn" onClick={openScheduleDiv}>Schedule Later</button>
                </div>
                {suggestions.length !== 0 && <DropDown locations = {suggestions} handleClick={pointLocation}/>}
             </div>
             }
             {schedule &&
                <div className="scheduleDiv">
                   <DatePicker onDateChange={setDate}/>
                   <div className='timeDiv'>
                      <input type="time" name="time" className='time' min="6:00" max="23:59" value={time} onChange = {(evt) => setTime(evt.target.value)} />
                      <i className="fi fi-sr-time-check" onClick={scheduleRide}></i>
                   </div>
                   <i className="fi fi-sr-angle-circle-right" onClick={() => setSchedule(false)}></i>
                </div>}
             <div ref={mapContainer} className="mapDiv"></div>
             <div className='rideShare' ref = {rideShareDiv}>
                <div>Are you comformtable with ride sharing?</div>
                <div className='yesNo'>
                   <i className="fi fi-sr-cross-circle" onClick={() => bookNow(false)}></i>
                   <i className="fi fi-sr-badge-check" onClick={() => bookNow(true)}></i>
                </div>
             </div>
             { msg !== "" && <div className='msgDiv'>{msg}</div> }
             {rideList.length > 0 && <RideList rides = {rideList} />}
        </div>
    </>
    )
};