import React from 'react'
import {Link} from "react-router-dom"
import "../styles/navbar.css"
import HomeIcon from '@mui/icons-material/Home';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EventNoteIcon from '@mui/icons-material/EventNote';

function Navbar(props) {
  return (
    <nav className='navbar'>
        <Link to="/" className='nav_link'>
            <p className='logo'>HopOn</p>
        </Link>
        <div className='nav_space'>

        </div>
        <div className='nav_options'>
            <Link to="/driverHome" className='nav_link'>
                <div className='nav_option nav_home'>
                        <HomeIcon/>
                        <p>Home</p>
                </div>
            </Link>
            <Link to="/" className='nav_link'>
                <div className='nav_option nav_bookings'>
                    <EventNoteIcon/>
                    <p>Bookings</p>
                </div>
            </Link>
            <div className='nav_link' onClick={props.func}>
                <div className='nav_option nav_profile'>
                    <AccountCircleIcon/>
                    <p>Profile</p>
                </div>
            </div>
        </div>
    </nav>
  )
}

export default Navbar