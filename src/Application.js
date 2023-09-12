import {BrowserRouter as Router, Routes, Route} from "react-router-dom";
import UserAccount from "./UserAccount";
import Login from "./Login"
import Register from "./Register"
import AddTask from "./AddTask"
import Header from "./Header"
import EditTask from "./EditTask"
import "./index.css"

export default function Application() {
    return ( 
        <div>        
            <Router>
                <Routes>
                    <Route path="/account/*" element={<UserAccount header={<Header/>}/>}/>            
                    <Route path="/login" element={<Login/>}/>
                    <Route path="/register" element={<Register/>}/>
                    <Route path="/addtask" element={<AddTask header={<Header/>}/>}/>     
                    <Route path="/edittask/:id" element={<EditTask header={<Header/>}/>}/> 
                    <Route path="/*" element={<PageNotFound/>}/>                 
                </Routes>
            </Router>
        </div>       
    )
}

function PageNotFound(){
    return (
        <div className="notFound">
            <h1 >Страница не найдена!</h1>
        </div>
    )
}
