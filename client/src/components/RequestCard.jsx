import React from 'react'
import "../styles/RequestCard.css"
import { useStateValue } from '../StateProvider';
import DoubleArrowIcon from '@mui/icons-material/DoubleArrow';

function RequestCard(props) {
  const [ {requestBasket}, dispatch ] = useStateValue();
  function acceptRide(){
    props.func(props.ride_id);
    dispatch(
      {
        type: 'ACCEPT'
      }
    );
  }
  function removeFromRequests(){
    dispatch(
      {
          type:'REJECT',
          item:{
              ride_id: props.ride_id
          }
      });
  }
  return (
    <div className='requestCard'>
        <div className='requestHeader'>
          <strong>{props.pick_up}</strong>
          <div className='requestBody'>
            <strong style={{fontSize: "14px", fontWeight: "bold", fontFamily: "Rubik"}}>{props.distance}</strong>
            <DoubleArrowIcon/>
          </div>
          <strong>{props.drop}</strong>
        </div>
        <div className='requestFooter'>
          <strong>{props.username}</strong>
          <div className='request_buttons'>
              <button className='accept' onClick={acceptRide}>Accept</button>
              <button className='reject' onClick={removeFromRequests}>Reject</button>
          </div>
        </div>
    </div>
  )
}

export default RequestCard