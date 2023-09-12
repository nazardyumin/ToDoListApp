import React, {useState} from "react";
import {useNavigate, Link} from "react-router-dom";
import axios from "axios";
import {isNullOrWhitespace} from "./helper";
import "./login.css"

export default function Login () {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function handleLogin(e){
        e.preventDefault();

        if (isNullOrWhitespace(password)) {
            alert("Поле 'Пароль' не может быть пустым!");
            return;
        }

        let result;
            try {
                result = await axios.post("http://localhost:5000/api/login", JSON.stringify({email: email, password: password}));
            } catch (error) {
                console.log(error);
            }

        if (result.data.incorrectCredentials){
            setEmail("");
            setPassword("")
            alert(`${result.data.message}`);
        }else{
            let user = result.data;
            localStorage.setItem("authorization-token", JSON.stringify({
                id: user.id,
                firstname: user.firstname,
                lastname: user.lastname,
                expires: new Date().getTime()+(24*60*60*1000)}));
            navigate("/account/active");
        }
    }

    return (
        <div className="loginContainer">
            <h1>ToDoList App</h1>
            <form onSubmit={handleLogin}>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username email" placeholder="Имя пользователя"/>
                <br />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" placeholder="Пароль"/>
                <br />
                <p><Link to="/register">Регистрация</Link> <button type="submit">Войти</button></p>
            </form>
        </div>
    )
}