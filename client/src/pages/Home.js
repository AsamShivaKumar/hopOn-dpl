import React, { useState, useEffect, useRef } from 'react';
import '@tomtom-international/web-sdk-maps/dist/maps.css';
import tt from '@tomtom-international/web-sdk-maps';
import ttServices from "@tomtom-international/web-sdk-services";
import DropDown from '../utils/DropDown';

import '../styles/home.css';

export default function Home(){

    const mapContainer = useRef(null);
    const [mapLong, setMapLong] = useState(86);
    const [mapLat, setMapLat] = useState(-45);
    const [mapZoom, setMapZoom] = useState(16);
    const [map, setMap] = useState({});
    const apiKey = "z0vcTRaQzJbXUlO6Obha1DR3tMJQFhdT";
    const [suggestions,setSuggestions] = useState([]);
    const [pickLoc,setPickLoc] = useState("");
    const [dropLoc,setDropLoc] = useState("");
    const [pickup,setPickup] = useState([]);
    const [drop,setDrop] = useState([]);
    const [pick,setPick] = useState(true);
    const [dropMarker,setDropMarker] = useState(null)
    const [pickMarker,setPickMarker] = useState(null);

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
      if(pickMarker !== null){
        pickMarker.on('dragend',() => {
          console.log(dropMarker)
          createRoute();
        });
      }
    },[pickMarker]);

    useEffect(() => {
      if(dropMarker !== null){
        dropMarker.on('dragend',createRoute);
      }
    },[dropMarker])

    const fuzzySearch = (evt) => {
      const query = evt.target.value;
      if(evt.target.getAttribute("name") === "pickup") setPickLoc(query);
      else setDropLoc(query);

      if(query.length < 6) return;
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
        // console.log(res.results);
        if(evt.target.getAttribute("name") === "pickup") setPick(true);
        else setPick(false);
      }) 
    };

    function pointLocation(latPos,longPos,locName){

      if(pick === true) setPickLoc(locName);
      else setDropLoc(locName);

      map.flyTo({center: [longPos,latPos]});
      if(pick === true){
        setPickup([longPos,latPos]);
        
        if(pickMarker === null){
          const marker = new tt.Marker({
            draggable: true
          }).setLngLat([longPos,latPos]).addTo(map);
          setPickMarker(marker);
          marker.on('dragend',createRoute);
        }else pickMarker.setLngLat([longPos,latPos]);
      
      }else{
        setDrop([longPos,latPos]);

        if(dropMarker === null){
          const marker = new tt.Marker({
            draggable: true
          }).setLngLat([longPos,latPos]).addTo(map);
          setDropMarker(marker);
          marker.on('dragend', createRoute);
        }else dropMarker.setLngLat([longPos,latPos]);

      }
    }

    function displayRoute(geoJSON){
      const layer = map.getLayer('route');
      if(layer !== undefined) map.getSource('route').setData(geoJSON);
      else{
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
        })
      }
    }

    function createRoute(){
      console.log(pickMarker,dropMarker);
      if(pickMarker === null || dropMarker === null) return;
      const coords = [pickMarker.getLngLat(),dropMarker.getLngLat()];
      var routeOptions = {
        key: apiKey,
        locations: coords,
        travelMode: 'car'
      }
      const center = [pickMarker.getLngLat().lng,pickMarker.getLngLat().lat]
      ttServices.services.calculateRoute(routeOptions)
      .then(res => {
        const geoJson = res.toGeoJson();
        map.flyTo({center: center});
        displayRoute(geoJson);
      })
    }

    return (
    <>
        <div className='mainContainer'>
             <div className='searchBox'>
                <h1>From here to there, we'll get you anywhere!</h1>
                <input className="searchInput from" type="text" onChange = { fuzzySearch } placeholder="Enter pickup" name="pickup" value = {pickLoc} />
                <input className="searchInput to" type="text" onChange = { fuzzySearch } placeholder="Enter drop" name="drop" value = {dropLoc} />
                <button onClick={() => createRoute()} className="searchBtn">Search</button>
                {suggestions.length !== 0 && <DropDown locations = {suggestions} handleClick={pointLocation}/>}
             </div>
             <div ref={mapContainer} className="mapDiv"></div>
        </div>
    </>
    )
};