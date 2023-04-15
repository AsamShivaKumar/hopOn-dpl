

export const initialState = {
    requestBasket : [],
    user: null
}

export default function reducer(state, action) {
    switch(action.type){
        case 'ADD':
            let currentRideRequests = [...state.requestBasket]
            const index1 = state.requestBasket.findIndex((basketItem) => basketItem.ride_id===action.item.ride_id)
            if(index1<0){
                currentRideRequests.push(action.item)
            }
            return {
                ...state,
                requestBasket: currentRideRequests
            };
        case 'ACCEPT':
            return {
                ...state,
                requestBasket: []
            };
        case 'REJECT':
            let currentRequests = [...state.requestBasket];
            const index = state.requestBasket.findIndex((basketItem) => basketItem.ride_id===action.item.ride_id)
            if(index>=0){
                currentRequests.splice(index,1)
            }else{
                console.warn("Request doesn't exists.")
            }
            return{
                ...state,
                requestBasket: currentRequests 
            };
        default:
            return state;
    }

}