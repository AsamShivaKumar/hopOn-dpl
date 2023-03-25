import React, { useState, useEffect, useRef } from 'react';
import {Link} from 'react-router-dom';
import '@tomtom-international/web-sdk-maps/dist/maps.css';
import tt from '@tomtom-international/web-sdk-maps';
import ttServices from "@tomtom-international/web-sdk-services";
import DropDown from '../components/DropDown';
import DatePicker from '../components/DatePicker';
import axios from "axios";

import '../styles/home.css';

export default function Home(){

    const mapContainer = useRef(null);
    const [mapLong, setMapLong] = useState(86);
    const [mapLat, setMapLat] = useState(-45);
    const [mapZoom, setMapZoom] = useState(16);
    const [map, setMap] = useState(null);
    var userLocation = "";
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

    const driver_data = new Map();
    let car_markers = new Map();

    useEffect( () => {
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

        //   return () => map.remove();
    },[]);

    useEffect(() => {
      if(map !== null && driver_data.size === 0){
        ttServices.services.reverseGeocode({
          key: apiKey,
          position: [mapLong, mapLat],
        }).then(res => {
           userLocation = res.addresses[0].address.municipality;

           // fetch driver coords in the same location
           axios.get("/get-driver-coords",{
              params: {location: userLocation}
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
      if(pickMarker !== null){
        pickMarker.on('dragend',(evt) => {
          const lngLat = evt.target.getLngLat();
          pickMarker.setLngLat([lngLat.lng,lngLat.lat]);
          setCenter(true);
          setLocs(prevLocs => [lngLat,prevLocs[1]]);
        });
      }
    },[pickMarker]);

    useEffect(() => {
      if(dropMarker !== null){
        dropMarker.on('dragend',(evt) => {
          const lngLat = evt.target.getLngLat();
          dropMarker.setLngLat([lngLat.lng,lngLat.lat]);
          setLocs(prevLocs => [prevLocs[0],lngLat]);
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
      console.log("fuzzy");
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
        displayRoute(geoJson);
      })
    }

    function openScheduleDiv(){
      if(pickMarker !== null && dropMarker !== null) setSchedule(true);
    }

    function scheduleRide(){
       const dateObj = date;
       const rideTime = time;
       // axios req to server to schedule the ride
       setSchedule(false);
    }

    return (
    <>
        <div className='mainContainer'>
             <nav>
              <h1>HopOn</h1>
              <div>
                <Link href="/continuous"><i className="fi fi-sr-alarm-clock" alt="continuous booking"></i></Link>
                <Link href="/scheduled-rides"><i className="fi fi-sr-calendar-clock" alt="Scheduled rides"></i></Link>
                <Link href="/profile"><i className="fi fi-sr-user" alt="Profile"></i></Link>
              </div>
             </nav>
             {!schedule && 
             <div className='searchBox'>
                <h1>From here to there, we'll get you anywhere!</h1>
                <input className="searchInput from" type="text" onChange = { fuzzySearch } placeholder="Enter pickup" name="pickup" value = {pickLoc} />
                <input className="searchInput to" type="text" onChange = { fuzzySearch } placeholder="Enter drop" name="drop" value = {dropLoc} />
                <div className='bookingBtnDiv'>
                  <button className="searchBtn">Book Now</button>
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
        </div>
    </>
    )
};