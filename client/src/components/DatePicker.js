import {useEffect, useRef, useState} from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
// import "flatpickr/dist/themes/dark.css";

import "../styles/datePicker.css";


export default function DatePicker(props){
    const inputRef = useRef(null);
    const [date,setDate] = useState("Select date");

    useEffect(() => {
        flatpickr(inputRef.current,{theme: "dark", dateFormat: "d-m-Y", onChange: handleChange, disableMobile: "true"});
    }, [props]);

    function handleChange(selectedDates, dateStr, instance){
        setDate(dateStr);
        props.onDateChange(selectedDates[0]);
    }

    return(
    <>
        <label htmlFor="date" className="dateLabel"><i className="fi fi-sr-calendar"></i><span>{date}</span></label>
        <input type="data" ref = {inputRef} id="date" />
    </>
    )
}