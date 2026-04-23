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
      {login?<Home number={number} setLogin={setLogin} />:<Login setLogin={setLogin} setMyNumber={setNumber}/>}


    </div>
  );
}
