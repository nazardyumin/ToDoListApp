import React, {useEffect, useState} from "react";
import {Routes, Route, Navigate, Link, useNavigate} from "react-router-dom";
import axios from "axios";
import "./userAccount.css"

export default function UserAccount(props) {
    let token = JSON.parse(localStorage.getItem("authorization-token"));
    
    const [activeTasks, setActiveTasks] = useState([]);
    const [completedTasks, setCompletedTasks] = useState([]);
    const [expiredTasks, setExpiredTasks] = useState([]);
    const redirect = useNavigate();
    
    useEffect(() => {  
        fetchData();
    },[])

    async function fetchData() {
        if(token){
            try{
                const response = await axios.get(`http://localhost:5000/api/account_data/${token.id}`);
                const listPriorities = response.data.priorities;
                const listTasks = response.data.tasks;
                listTasks.forEach(task => {
                    task.priority = listPriorities.find(p=>p.id===task.priority_id).priority;
                    task.tagsToSearch = "";
                    if(task.tags){
                        task.tagsToSearch = task.tags;
                        task.tags = task.tags.split(",");
                    }
                    else task.tags=[];
                });
                let aTasks = listTasks.filter(t=>t.isCompleted===0&&Number(t.deadline)>new Date().getTime());
                let cTasks = listTasks.filter(t=>t.isCompleted===1);
                let eTasks = listTasks.filter(t=>t.isCompleted===0&&Number(t.deadline)<=new Date().getTime());
                aTasks.forEach(t=>{
                    t.timers=[];
                })
                setActiveTasks(aTasks);
                setCompletedTasks(cTasks);
                setExpiredTasks(eTasks);
            }
            catch(error) {
                console.log(error);
            }
        }          
    }

    async function deleteTask(id){
        try{
            await axios.get(`http://localhost:5000/api/deletetask/${id}`);
            fetchData();
            }
        catch(error) {
            console.log(error);
            }
    }

    async function editTask(id){
        redirect(`/edittask/${id}`);
    }

    if (token && token.expires>new Date().getTime()){

        let aCount = activeTasks.length;
        let cCount = completedTasks.length;
        let eCount = expiredTasks.length;
        
        return(          
            <div className="userAccountViewer">
            {props.header}
                <Link className="addTaskBtn" to="/addtask">Добавить задачу</Link>
                <div className="workSpace">
                <Routes>
                    <Route path="/active" element={<ActiveTasks activeTasks={activeTasks} editTask={editTask} filterTasks={setActiveTasks} deleteTask={deleteTask} aCount={aCount} cCount={cCount} eCount={eCount} fetchData={fetchData} token={token}/>}/>
                    <Route path="/completed" element={<CompletedTasks completedTasks={completedTasks} aCount={aCount} cCount={cCount} eCount={eCount}/>}/>
                    <Route path="/expired" element={<ExpiredTasks expiredTasks={expiredTasks} aCount={aCount} cCount={cCount} eCount={eCount}/>}/>
                </Routes>
                </div>     
            </div> 
        ) 
    }
    else {
        return <Navigate to="/login"/>
    }
}

function ActiveTasks(props){
    const [tags, setTags] = useState([]);
    const [priorities, setPriorities] = useState([]);
    const [hints, setHints] = useState([]);

    useEffect(() => {
        fetchHints();  
    },[])

    async function fetchHints(){
        try{
            const response = await axios.get(`http://localhost:5000/api/addtask_data/${props.token.id}`);
            setPriorities(response.data.priorities);
            setTags(response.data.tags);
        }
        catch(error) {
            console.log(error);
        }
    }

    function formatRemainingTime(remainingTime) {
        const seconds = Math.floor((remainingTime / 1000) % 60);
        const minutes = Math.floor((remainingTime / (1000 * 60)) % 60);
        const hours = Math.floor((remainingTime / (1000 * 60 * 60)) % 24);
        const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
        if (days===0 && hours===0 && minutes===0) return `${seconds}с`;
        else if (days===0 && hours===0) return `${minutes}м ${seconds}с`;
        else if (days===0) return `${hours}ч ${minutes}м ${seconds}с`;
        else return `${days}д ${hours}ч ${minutes}м ${seconds}с`;
    }

    async function completeTask(taskId){  
        const task = props.activeTasks.find(t=>t.id===taskId);
        let timers = Array.from(task.timers);
        timers.forEach(t=>{
            clearInterval(t)
        })
        try{
            await axios.get(`http://localhost:5000/api/completetask/${taskId}`);
            props.fetchData();
            }
        catch(error) {
            console.log(error);
            }
    }

    function showTimerText(taskId, element){
        const timer = setInterval(() => {
            if(!document.getElementById(element)){  
                clearInterval(timer);
                return;
            }
            let task = props.activeTasks.find(t=>t.id===taskId);
            task.timers.push(timer);
            const remainingTime = task.deadline - new Date().getTime();
            if(remainingTime <= 0) {
                props.fetchData();
                clearInterval(timer);
            }
            else {
                document.getElementById(element).textContent = `, осталось: ${formatRemainingTime(remainingTime)}`;
            }
        }, 1000);     
    }

    function searchTasks(){    
        const searchValue = document.querySelector("#searchInput").value;
        if (searchValue ===""){
            props.fetchData();
            return;
        }
        const searchBy = document.querySelector("#searchBy").value;
        const regexp = new RegExp(searchValue, 'gi');
        let filteredTasks;
        if (searchBy==="названию") filteredTasks = props.activeTasks.filter(t=>t.title.match(regexp));      
        else if (searchBy==="приоритету") filteredTasks = props.activeTasks.filter(t=>t.priority.match(regexp));
        else filteredTasks = props.activeTasks.filter(t=>t.tagsToSearch.match(regexp));
        props.filterTasks(filteredTasks);
    }

    function clearInput(e){
        e.preventDefault();
        document.querySelector("#searchInput").value='';
        props.fetchData();
    }

    function changeHints(e){
        if(e.target.value==="названию") setHints([]);
        else if (e.target.value==="приоритету") {
            let array=[];
            priorities.forEach(el=>array.push(el.priority));
            setHints(array);
        }
        else {
            let array=[];
            tags.forEach(el=>array.push(el.tag));
            setHints(array);
        }
    }

    return( 
        <div className="taskViewer">
            <p className="taskNavigation">Активные задачи ({props.aCount})  <Link to="/account/completed">Завершенные задачи ({props.cCount})</Link>   <Link to="/account/expired">Просроченные задачи ({props.eCount})</Link></p>
            <div className="searchContainer">
                <input id="searchInput" type="text" list="data" placeholder="Поиск задач по" onChange={searchTasks} onKeyUp={searchTasks}/>
                <datalist id="data">
                    {hints.map((t,i)=>(
                    <option key={i}>{t}</option>
                    ))}
                </datalist>
                <select id="searchBy" onChange={changeHints}>
                    <option>названию</option>
                    <option>приоритету</option>
                    <option>тегу</option>
                </select>
            <button onClick={clearInput}>Сброс</button>
        </div>
        <ul className="scrollingContainer">
            {props.activeTasks.map(item=>(
                <li key={item.id} className="taskContainer"> 
                <b><p>{item.title}   <button className="btnEdit" onClick={()=>props.editTask(item.id)}/> <button className="btnDelete" onClick={()=>props.deleteTask(item.id)}/></p></b>
                <p>Описание: {item.description}</p>
                <p>Приоритет: {item.priority}</p>
                <span>Планируемое время завершения: {new Date(Number(item.deadline)).toLocaleString()}<span id={`timer${item.id}`}/>{showTimerText(item.id, `timer${item.id}`)}</span>
                <p>{item.tags.map((t, i)=>(<span key={i} className="tags">#{t}</span>))}</p>
                <button onClick={()=>completeTask(item.id)}>Завершить задачу</button>
                </li>
            ))}
        </ul>      
        </div>           
    ) 
}

function CompletedTasks(props){
    return (
        <div className="taskViewer">
            <p className="taskNavigation"><Link to="/account/active">Активные задачи ({props.aCount})</Link> Завершенные задачи ({props.cCount}) <Link to="/account/expired">Просроченные задачи ({props.eCount})</Link></p>
            <ul className="scrollingContainer">
            {props.completedTasks.map(item=>(
                <li key={item.id} className="completedTaskContainer"> 
                <b><p>{item.title}</p></b>
                <p>Описание: {item.description}</p>
                <p>Приоритет: {item.priority}</p>
                <span>Планируемое время завершения: {new Date(Number(item.deadline)).toLocaleString()}</span>
                <br/><br/>
                <span>Завершено: {new Date(Number(item.finished)).toLocaleString()}</span>
                <p>{item.tags.map((t, i)=>(<span key={i} className="tags">#{t}</span>))}</p>
                </li>
            ))}
            </ul>      
        </div>
    )  
}

function ExpiredTasks(props){
    return (
        <div className="taskViewer">
            <p className="taskNavigation"><Link to="/account/active">Активные задачи ({props.aCount})</Link> <Link to="/account/completed">Завершенные задачи ({props.cCount})</Link> Просроченные задачи ({props.eCount})</p>
            <ul className="scrollingContainer">
            {props.expiredTasks.map(item=>(
                <li key={item.id} className="expiredTaskContainer"> 
                <b><p>{item.title}</p></b>
                <p>Описание: {item.description}</p>
                <p>Приоритет: {item.priority}</p>
                <span>Планируемое время завершения: {new Date(Number(item.deadline)).toLocaleString()}</span>
                <p>{item.tags.map((t, i)=>(<span key={i} className="tags">#{t}</span>))}</p>
                </li>
            ))}
            </ul>      
        </div>
    )  
}