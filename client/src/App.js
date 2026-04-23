import Home from "./home";
import Login from "./login";
import "./App.css";
import { useState } from "react";

export default function App()
{
  const [login,setLogin]=useState(false);
  const [number,setNumber]=useState("");
  return(
    <div>
     {/* {login?<Home number={"9392961889"} setLogin={setLogin} />:<Login setLogin={setLogin} setMyNumber={setNumber}/>} */}
    <Home number={"9392961889"} setLogin={setLogin} />

    </div>
  );
}