import axios from "axios"
import {useState,useEffect} from "react"

function App() {

  const [msg,setMsg] = useState("App")

  useEffect(() => {
    axios.get("/app")
    .then(res =>{
       setMsg(res.data)
    })
  },[]);

  return (
    <h1>  {msg} </h1>
  );
}

export default App;
