import { useNavigate } from 'react-router-dom';
import '../styles/rideList.css';
import { useEffect } from 'react';

export default function RideList(props){
    const navigate = useNavigate();

    function openRide(ride){
        if(ride.date) return;
        navigate(`ride/${ride._id}`);
    }

    return (
        <div className="rideList">
        {props.rides.map(ride => {
            const className = "fi fi-sr-bullet" + (!ride.time? " ns":" s");
            return <div className="rideObj" key={ride._id} onClick={() => openRide(ride)}>
                       <div className='pickDropDiv'>
                            <p>{ride.pickLoc}</p>
                            <p>{ride.dropLoc}</p>
                       </div>
                       <div className='dateTime'>
                          <i className={className}></i>
                          { ride.date && <p>{ride.date.slice(0,10)}</p>}
                          { ride.date && <p>{ride.time}</p>}
                       </div>
                   </div>
        })}
        </div>
    )
}