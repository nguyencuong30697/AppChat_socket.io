const express = require('express');
const socketio = require('socket.io');
const http= require('http');
const fs = require('fs');
const cors = require('cors');
const router = require('./router');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./users');

const mysql = require('mysql');
var config = require('./config/configDB.js');

var connectionDB = mysql.createConnection(config.databaseOptions);
connectionDB.connect((err)=>{
    if(!err){
        console.log("Connect mySQL success!");
        // connectionDB.query('SELECT * FROM employees', (err,rows) => {
        //     if(err) throw err;
          
        //     console.log('Data received from Db:\n');
        //     console.log(rows);
        // });
        // const employee = { name: 'Cuong', location: 'Australia' };
        // connection.query('INSERT INTO employees SET ?', employee, (err, res) => {
        // if(err) throw err;

        // console.log('Last insert ID:', res.insertId);
        // });

        const PORT = process.env.PORT || 3001
        const app = express();
        const server = http.createServer(app);
        const io = socketio(server); // Phai de trong http

        app.use(cors());
        app.use(router);

        io.on('connection',(socket)=>{
            // don su kien join tu ben chat.js
            socket.on('join', ({ name, room }, callback) => {
                // console.log(name,room) // lay thong tin nguoi moi join
                // truyen ca error vi ben app.js ta co them ca 1 bien la error cho nen o day can them 1 bien la error
                // Nhu la 1 oject co 2 thuoc tinh user va error
                const { error, user } = addUser({ id: socket.id, name, room });
                //callback nay dung de xu ly khi ma co loi say ra 
                // no se gui lai 1 cai la error ve phia client trong chat.js
                if(error) return callback(error);
                // cho join vao room nao
                socket.join(user.room);
                // ADmin gui su kien tin nhan toi 1 nguoi la nguoi moi join vao
                socket.emit('message', { user: 'admin', text: `${user.name}, welcome to room ${user.room}.`});
                // Su kien broadcast la gui tin nhan den tat ca moi nguoi trong phong tu admin
                socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined!` });
                // xem duoc tat ca cac user
                io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });
            
                callback();
            });

            socket.on('sendMessage', (message, callback) => {
                // lay nguoi dungg gui tin nhan
                const user = getUser(socket.id);
                // chi dinh noi gui tin nhan la roomname
                const emptyMess = { user: user.name , text: message };

                connectionDB.query('INSERT INTO ChatTable SET ?', emptyMess, (err, res) => {
                if(err) throw err;
                });

                //
                io.to(user.room).emit('message', { user: user.name, text: message });
                // goi ham call back de lam j do sau khi gui tin nhan

                callback();
            });

            socket.on('disconnect',()=>{
                //Phai xoa user neu ko luc reload lai trang no van co user o do => ko the truy cap vao dc vi user da ton tai
                const user = removeUser(socket.id);

                if(user) {
                    io.to(user.room).emit('message', { user: 'Admin', text: `${user.name} has left.` });
                    io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});
                }
            })
        });

        app.get('/datachat', async (req,res)=>{
                //get data in mySQL
                connectionDB.query('SELECT * FROM ChatTable', (err,rows) => {
                    if(err) throw err;
                    try{
                        res.status(200).json({
                            success: true,
                            data: {
                                data: rows,
                            }
                        });
                    }catch(error){
                        res.status(500).json({
                            success: false,
                            message: error.message,
                        });
                    }
                });
        });

        server.listen(3001,(error) => {
            if(error){
                throw error;
            }else{
                console.log(`Server listen on port ${PORT} ...`);
            }
        });

    }else{
        console.log(err.message);
    }
})



