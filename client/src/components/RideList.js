import { useNavigate } from 'react-router-dom';
import '../styles/rideList.css';
import { useEffect } from 'react';

export default function RideList(props){
    const navigate = useNavigate();

    function openRide(ride_id){
        navigate(`ride/${ride_id}`);
    }

    return (
        <div className="rideList">
        {props.rides.map(ride => {
            const className = "fi fi-sr-bullet" + (!ride.time? " ns":" s");
            return <div className="rideObj" key={ride._id} onClick={() => openRide(ride._id)}>
                       <div className='pickDropDiv'>
                            <p>{ride.pickLoc}</p>
                            <p>{ride.dropLoc}</p>
                       </div>
                       <i className={className}></i>
                   </div>
        })}
        </div>
    )
}