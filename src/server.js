const sqlite3 = require("sqlite3");
const open = require("sqlite").open;
const express = require("express");
const app = express();
const ServerMessages = require("./server-messages").ServerMessages;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((request, response, next) => {
    response.header("Access-Control-Allow-Origin", "*");
    response.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    response.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

app.post("/api/register",(request, response) => {
    const user = JSON.parse(Object.keys(request.body)[0]);
    open({
        filename: "sqlite.db",
        driver: sqlite3.Database,
    }).then(async (db) => {
        const result = await db.get(
            `SELECT id FROM Users WHERE email='${user.email}'`
        );    
        await db.close();
        if(result)  {
            response.json({message: `${ServerMessages.EmailExists}`, userExists: true});
        } else {
            await db.open();
            await db.run(
                `INSERT INTO Users (firstname, lastname, email, password) VALUES ('${user.firstname}', '${user.lastname}', '${user.email}', '${user.password}')`
            );
            await db.close();
            response.json({message: `${ServerMessages.UserSuccessfullyAdded}`});
        }
        });
});

app.post("/api/login",  (request, response) => {
    const credentials = JSON.parse(Object.keys(request.body)[0]);
    open({
        filename: "sqlite.db",
        driver: sqlite3.Database,
    }).then(async (db) => {
        const result = await db.get(
            `SELECT id, firstname, lastname FROM Users WHERE email='${credentials.email}' AND password='${credentials.password}'`
        );    
        await db.close();
        if(result) response.json(result);
        else response.json({message: `${ServerMessages.IncorrectCredentials}`, incorrectCredentials: true});
        });
});

app.get("/api/account_data/:id",  (request, response) => {
    let id = request.params.id;
    open({
        filename: "sqlite.db",
        driver: sqlite3.Database,
    }).then(async (db) => {
        let tasks = await db.all(
            `SELECT * FROM TodoList WHERE user_id=${id}`
        );
        if(!tasks) tasks=[];
        let priorities = await db.all(
            `SELECT * FROM Priorities`
        );    
        await db.close();
        response.json({tasks: tasks, priorities: priorities});
    });
});

app.get("/api/addtask_data/:id",  (request, response) => {
    let id = request.params.id;
    open({
        filename: "sqlite.db",
        driver: sqlite3.Database,
    }).then(async (db) => {
        let tags = await db.all(
            `SELECT * FROM Tags WHERE user_id=${id}`
        );
        if(!tags) tags=[];
        let priorities = await db.all(
            `SELECT * FROM Priorities`
        );    
        await db.close();
        response.json({tags: tags, priorities: priorities});
    });
});

app.post("/api/addnewtask",  (request, response) => {
    const task = JSON.parse(Object.keys(request.body)[0]);
    let taskArray=[];
    if(task.tags!==""){
        taskArray=task.tags.split(",")
    }
    open({
        filename: "sqlite.db",
        driver: sqlite3.Database,
    }).then(async (db) => {
        let tags = await db.all(
            `SELECT * FROM Tags WHERE user_id=${task.user_id}`
        );
        if(!tags) tags=[];
        let tagsToRemove = [];
        tags.forEach(el=>tagsToRemove.push(el.tag));
        taskArray = taskArray.filter( ( el ) => !tagsToRemove.includes( el ) );
        taskArray.forEach(async el => {
            await db.run(
                `INSERT INTO Tags (user_id, tag) VALUES ('${task.user_id}', '${el}')`
            );
        });
        await db.run(
                `INSERT INTO TodoList (user_id, priority_id, title, description, deadline, tags) VALUES ('${task.user_id}', '${task.priority_id}', '${task.title}', '${task.description}', '${task.deadline}', '${task.tags}')`
            );
        await db.close();
        response.json({message: `${ServerMessages.TaskAdded}`});
    });
});

app.post("/api/edittask",  (request, response) => {
    const task = JSON.parse(Object.keys(request.body)[0]);
    let taskArray=[];
    if(task.tags!==""){
        taskArray=task.tags.split(",")
    }
    open({
        filename: "sqlite.db",
        driver: sqlite3.Database,
    }).then(async (db) => {
        let tags = await db.all(
            `SELECT * FROM Tags WHERE user_id=${task.user_id}`
        );
        if(!tags) tags=[];
        let tagsToRemove = [];
        tags.forEach(el=>tagsToRemove.push(el.tag));
        taskArray = taskArray.filter( ( el ) => !tagsToRemove.includes( el ) );
        taskArray.forEach(async el => {
            await db.run(
                `INSERT INTO Tags (user_id, tag) VALUES ('${task.user_id}', '${el}')`
            );
        });
        await db.run(
                `UPDATE TodoList SET priority_id=${task.priority_id}, title='${task.title}', description='${task.description}', deadline='${task.deadline}', tags='${task.tags}' WHERE id=${task.id}`
            );
        await db.close();
        response.json({message: `${ServerMessages.TaskEdited}`});
    });
});

app.get("/api/deletetask/:id",  (request, response) => {
    let id = request.params.id;
    open({
        filename: "sqlite.db",
        driver: sqlite3.Database,
    }).then(async (db) => {
        await db.run(
            `DELETE FROM TodoList WHERE id=${id}`
        );
        await db.close();
        response.json({message: `${ServerMessages.TaskDeleted}`});
    });
});

app.get("/api/gettask/:id",  (request, response) => {
    let id = request.params.id;
    open({
        filename: "sqlite.db",
        driver: sqlite3.Database,
    }).then(async (db) => {
        let task = await db.get(
            `SELECT * FROM TodoList WHERE id=${id}`
        );
        let priorities = await db.all(
            `SELECT * FROM Priorities`
        );
        let tags = await db.all(
            `SELECT * FROM Tags WHERE user_id=${task.user_id}`
        );
        if(!tags) tags=[];
        await db.close();
        response.json({task: task, priorities: priorities, tags: tags});
    });
});

app.get("/api/completetask/:id",  (request, response) => {
    let id = request.params.id;
    open({
        filename: "sqlite.db",
        driver: sqlite3.Database,
    }).then(async (db) => {

        await db.run(
                `UPDATE TodoList SET isCompleted=1, finished='${new Date().getTime()}' WHERE id=${id}`
            );
        await db.close();
        response.json({message: `${ServerMessages.TaskCompleted}`});
    });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`${ServerMessages.ServerStartedOnPort} ${PORT}`);
});