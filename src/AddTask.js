import React, {useEffect, useState} from "react";
import {isNullOrWhitespace} from "./helper";
import {Link, Navigate, useNavigate} from "react-router-dom";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale, setDefaultLocale } from  "react-datepicker";
import ru from 'date-fns/locale/ru';
import moment from 'moment';
import "./taskRoutine.css"

registerLocale('ru', ru)
setDefaultLocale('ru');

export default function AddTask(props){
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [taskDate, setTaskDate] = useState(new Date());
    const [selectedPriorityId, setSelectedPriorityId] = useState(0);
    const [tags, setTags] = useState([]);
    const [priorities, setPriorities] = useState([]);

    const redirect = useNavigate();
    let token = JSON.parse(localStorage.getItem("authorization-token"));

    useEffect(() => {
        fetchData();  
    },[])

    async function fetchData(){
        if(token){
            try{
                const response = await axios.get(`http://localhost:5000/api/addtask_data/${token.id}`);
                const listPriorities = response.data.priorities;
                let array =[{id:0, priority:"Выберите приоритет"}];
                array.push(...listPriorities);
                setPriorities(array);
                const listTags = response.data.tags;
                setTags(listTags);
            }
            catch(error) {
                console.log(error);
            }
        }
    }

    function AddTagField(e){
        e.preventDefault();
        const but = document.querySelector("#tags").childNodes[0]
        let clone = but.cloneNode(true);
        clone.childNodes[0].value="";
        document.querySelector("#tags").appendChild(clone);
    }

    async function handlerAddTask(e){
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
            let tagList = document.querySelector("#tags").childNodes;
            let tagsArray=[];
            for(let i=0;i<tagList.length;i++){
                if (tagList[i].childNodes[0].value!=='') tagsArray.push(tagList[i].childNodes[0].value)
            }
            let tagsInTask="";
            if (tagsArray.length!==0){
                tagsInTask = tagsArray.join(",");
            }
            try {
                await axios.post("http://localhost:5000/api/addnewtask", JSON.stringify({user_id: token.id, priority_id: selectedPriorityId, title: title, description: description, deadline: taskDate.getTime(),tags: tagsInTask}));
            } catch (error) {
                console.log(error);
            }
            redirect("/account/active");
        }
    }

    function handlerSelectPriority(e){
        const id = priorities.find(p=>p.priority===e.target.value).id
        setSelectedPriorityId(id);
    }

    if (token && token.expires>new Date().getTime()){
        return(   
            <div>
            {props.header}
            <div className="taskRoutine">   
                <h2>Добавление новой задачи</h2>
                <form onSubmit={handlerAddTask}>  
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Введите название"/>
                    <DatePicker locale="ru" showTimeSelect dateFormat="Pp" selected={taskDate} onChange={date => setTaskDate(date)} minDate={moment().toDate()} timeCaption="Время" required  />
                    <br />
                    <select onChange={handlerSelectPriority} required>
                        {priorities.map((p)=>(<option key={p.id} value={p.priority}>{p.priority}</option>
                        ))}
                    </select>
                    <br />
                    <textarea value={description} rows={5} cols={50} onChange={e => setDescription(e.target.value)} required placeholder="Введите описание"/>               
                    <p id="tags"> 
                        <span>
                            <input type="text" list="data" placeholder="Введите тег"/>
                                <datalist id="data">
                                    {tags.map(t=>(
                                    <option key={t.id}>{t.tag}</option>
                                    ))}</datalist> </span></p>
                    <button onClick={AddTagField}>Добавить тег</button>
                    <br /><br />
                <p><Link to="/account/active">Назад</Link> <button type="submit">Добавить</button></p> 
                </form>
            </div> 
            </div>
        ) 
    }
    else {
        return <Navigate to="/login"/>
    }
}
