const express = require('express');
const socketio = require('socket.io');
const http= require('http');
const fs = require('fs');
const cors = require('cors');
const router = require('./router');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./users');

const PORT = process.env.PORT || 3001

const app = express();
const server = http.createServer(app);
const io = socketio(server); // Phai de trong http

app.use(cors());
app.use(router);


io.on('connection',(socket)=>{
    // don su kien join tu ben chat.js
    socket.on('join', ({ name, room }, callback) => {
        console.log(name,room) // lay thong tin nguoi moi join
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
        io.to(user.room).emit('message', { user: user.name, text: message });
        
        // goi ham call back de lam j do sau khi gui tin nhan
        callback();
      });

    //   socket.on('sendMessage', (message, callback) => {
    //     const user = getUser(socket.id);
    //     console.log(user.name);
    //     io.to(user.room).emit('message', { user: user.name, text: message });
    
    //     callback();
    //   });

    socket.on('disconnect',()=>{
        //Phai xoa user neu ko luc reload lai trang no van co user o do => ko the truy cap vao dc vi user da ton tai
        const user = removeUser(socket.id);

        if(user) {
        io.to(user.room).emit('message', { user: 'Admin', text: `${user.name} has left.` });
        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});
        }
    })
});




server.listen(3001,(error) => {
    if(error){
        throw error;
    }else{
        console.log(`Server listen on port ${PORT} ...`);
    }
});

