import React from "react";
import "../styles/dropdown.css";

export default function DropDown(props){
    return (
        <div className="dropDown">
             { props.locations.map(loc => {
                 return <div key = {loc.id} onClick = { () => props.handleClick(loc.position.lat,loc.position.lng,loc.poi.name)}>
                             <i className="fi fi-rs-marker"></i>
                             <div className="location">
                                <span className="poi">{loc.poi.name}</span>
                                <span className="address">{(!loc.address.streetName? "":(loc.address.streetName + ", "))  + (!loc.address.municipality? "":loc.address.municipality)}</span>
                             </div>
                        </div>
             })}
        </div>
    )
}