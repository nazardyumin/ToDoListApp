import React, {useEffect, useState} from "react";
import {Navigate, Link, useNavigate, useParams} from "react-router-dom";
import axios from "axios";
import {isNullOrWhitespace} from "./helper";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale, setDefaultLocale } from  "react-datepicker";
import ru from 'date-fns/locale/ru';
import moment from 'moment';
import "./userAccount.css"

registerLocale('ru', ru)
setDefaultLocale('ru');

export default function UserAccount(props) {
    const params = useParams();
    let id = params.id;
    let token = JSON.parse(localStorage.getItem("authorization-token")); 
    const [taskId, setTaskId] = useState(0);
    const [tags, setTags] = useState([]);
    const [priorities, setPriorities] = useState([]);
    const [taskTags, setTaskTags] = useState([]);
    const [tagsToRemove, setTagsToRemove] = useState([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [taskDate, setTaskDate] = useState(new Date());
    const [selectedPriority, setSelectedPriority] = useState("");
    const [selectedPriorityId, setSelectedPriorityId] = useState(0);
    const redirect = useNavigate();

    useEffect(() => {  
        fetchTask(id);
    },[])

    async function fetchTask(id){
        try{
            const response = await axios.get(`http://localhost:5000/api/gettask/${id}`);
            setTaskId(response.data.task.id)
            setTitle(response.data.task.title);
            setPriorities(response.data.priorities);
            setTags(response.data.tags);
            if (response.data.task.tags !=='') setTaskTags(response.data.task.tags.split(","));
            setTaskDate(new Date(Number(response.data.task.deadline)));
            setSelectedPriorityId(response.data.task.priority_id);
            setSelectedPriority(response.data.priorities.find(p=>p.id===response.data.task.priority_id).priority);
            setDescription(response.data.task.description);
        }
        catch(error) {
            console.log(error);
        }
    }

    function handlerSelectPriority(e){
        const id = priorities.find(p=>p.priority===e.target.value).id
        setSelectedPriority(e.target.value);
        setSelectedPriorityId(id);
    }

    function handlerDeleteTag(e,id){
        e.preventDefault();
        let parent = document.querySelector("#tagField");
        let child = document.querySelector(`#${id}`);
        let newArray=Array.from(tagsToRemove);
        newArray.push(child.textContent);
        setTagsToRemove(newArray);
        parent.removeChild(child);
    }

    function AddTagField(e){
        e.preventDefault();
        const but = document.querySelector(".tagInput");
        let clone = but.cloneNode(true);
        clone.childNodes[0].value="";
        document.querySelector("#tagField").appendChild(clone);
    }

    async function handlerEditTask(e){
        e.preventDefault();
        if(selectedPriorityId===0){
            alert("Приоритет не выбран!");
            return;
        }else if (isNullOrWhitespace(title)){
            alert("Поле 'Название' не может быть пустым!'");
            setTitle("");
            return;
        }else if (isNullOrWhitespace(description)){
            alert("Поле 'Описание' не может быть пустым!");
            setDescription("");
            return;
        }else{
            let tagList = document.querySelectorAll(".tagInput");
            let tagsArray=taskTags.filter( ( el ) => !tagsToRemove.includes( el ) );
            for(let i=0;i<tagList.length;i++){
                if (tagList[i].childNodes[0].value!=='') tagsArray.push(tagList[i].childNodes[0].value)
            }
            let tagsInTask="";
            if (tagsArray.length!==0){
                tagsInTask = tagsArray.join(",");
            }
            try {
                await axios.post("http://localhost:5000/api/edittask", JSON.stringify({id:taskId, user_id: token.id, priority_id: selectedPriorityId, title: title, description: description, deadline: taskDate.getTime(),tags: tagsInTask}));
            } catch (error) {
                console.log(error);
            }
            redirect("/account/active");
        }
    }

    if (token && token.expires>new Date().getTime()){
        return(          
            <div>
            {props.header}
                <div className="taskRoutine">
                <h2>Редактирование задачи</h2>
                <form onSubmit={handlerEditTask}>  
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Введите название"/>
                    <DatePicker locale="ru" showTimeSelect dateFormat="Pp" selected={taskDate} onChange={date => setTaskDate(date)} minDate={moment().toDate()} timeCaption="Время" required  />
                    <br />
                    <select value={selectedPriority} onChange={handlerSelectPriority} required>
                        {priorities.map((p)=>(<option key={p.id} value={p.priority}>{p.priority}</option>
                        ))}
                    </select>
                    <br />
                    <textarea value={description} rows={5} cols={50} onChange={e => setDescription(e.target.value)} required placeholder="Введите описание"/>
                    <div id="tagField" className="tagField2">
                        {taskTags.length>0?taskTags.map((t,index)=>
                        <p id={`tag${index}`} key={t}>{t}<button className="btnDelete" onClick={(e)=>handlerDeleteTag(e,`tag${index}`)}/></p> 
                        ):<></>} 
                        <span className="tagInput">
                            <input type="text" list="data" placeholder="Введите тег"/>
                                <datalist id="data">
                                    {tags.map(el=>(
                                    <option key={el.id}>{el.tag}</option>
                                    ))}
                                </datalist> 
                        </span>
                    </div>
                    <button onClick={AddTagField}>Добавить тег</button>
                    <br /><br />
                    <p><Link to="/account/active">Назад</Link> <button type="submit">Сохранить</button></p>
                </form>
                </div>         
            </div>
        ) 
    }
    else {
        return <Navigate to="/login"/>
    }
}