import {useNavigate} from "react-router-dom";
import "./header.css"

export default function Header(){
    let token = JSON.parse(localStorage.getItem("authorization-token")); 
    const canShowHeader = (token && token.expires>new Date().getTime())  
    const redirect = useNavigate();

    function Logout(){
        localStorage.removeItem("authorization-token");
        redirect("/login");
    }

    return(
        <div className="headerInfo">
            {canShowHeader?  <div className="headerContainer"><h2>ToDoList App</h2><p>{token.firstname} {token.lastname} <button onClick={Logout}>Выйти</button></p></div> : <></>}      
        </div>
    )
}