import React, {useState} from "react";
import {useNavigate, Link} from "react-router-dom";
import axios from "axios";
import {isNullOrWhitespace} from "./helper";

export default function Register () {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password1, setPassword1] = useState("");
    const [password2, setPassword2] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

    async function handleRegister(e){
        e.preventDefault();
        if(password1 !== password2){
            setPassword1("");
            setPassword2("");
            alert("Пароли не совпадают!");
        }else if(isNullOrWhitespace(firstName))
        {
            setFirstName("");
            alert("Поле 'Имя' не может быть пустым!");
        }else if (isNullOrWhitespace(lastName))
        {
            setLastName("");
            alert("Поле 'Фамилия' не может быть пустым!");
        }else {
            let result;
            try {
                result = await axios.post("http://localhost:5000/api/register", JSON.stringify({firstname: firstName, lastname: lastName, email: email, password: password1}));
            } catch (error) {
                console.log(error);
            }
            if (result.data.userExists){
                setEmail("");
                alert(`${result.data.message}`);
            }else{
                navigate("/account/active");
            } 
        }    
    }

    return (
        <div className="loginContainer">    
            <h3>Регистрация нового пользователя</h3>
            <form onSubmit={handleRegister}>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="Имя"/>
                <br />
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="Фамилия"/>
                <br />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username email" placeholder="E-mail"/>
                <br />
                <input type="password" value={password1} onChange={e => setPassword1(e.target.value)} required minLength={8} autoComplete="new-password" placeholder="Пароль"/>
                <br />
                <input type="password" value={password2} onChange={e => setPassword2(e.target.value)} required minLength={8} autoComplete="new-password" placeholder="Повторите пароль"/>
                <br />
                <p><Link to="/login">Войти</Link> <button type="submit">Зарегистрироваться</button></p>
            </form>
        </div>
    )
}