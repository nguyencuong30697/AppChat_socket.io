import React, {useState,useEffect} from 'react';
import queryString from 'query-string';
import io from "socket.io-client";
import './Chat.css';
import InfoBar from '../InfoBar/InfoBar';
import Input from '../Input/Input';
import Messages from '../Messages/Messages';
import TextContainer from '../TextContainer/TextContainer';

let socket;

const Chat = ({location})=>{ // location dia chi

    const [users, setUsers] = useState(''); // hien nguoi trong room
    const [name,setName] = useState('');
    const [room,setRoom] = useState(''); 
    const [message, setMessage] = useState(''); // luu 1 tin nhan
    const [messages, setMessages] = useState([]); // mang luu tin nhan
    //viet cho sach se hon
    const ENDPOINT = 'localhost:3001';

    const getData = async () => {
        try{
            const result = await fetch(`http://localhost:3001/datachat`,{
                method:'GET',
                headers:{
                    'Content-Type':'application/json',
                },
                // credentials:'include', Do cai cors ben server de trong nen ben nay ko can phai ghi vao 
            }).then((res)=>{return res.json();})
            
            // console.log(result.data.data); // data tra ve
            return result.data.data;

        }catch(error){
            window.alert(error.message);
        }
    };
    
    useEffect(()=>{
        // demo lay data
        const data = queryString.parse(location.search);
        // console.log(location.search); // la duong dan url
        // console.log(data); // la mang chua gia tri cac bien theo key-value     
        // lam that
        const { name, room } = queryString.parse(location.search);
        // ket noi dau tien .. server port la 3001 => vi tri den la localhost:3001
        socket =io(ENDPOINT); 
        setName(name);
        setRoom(room);
        //console.log(socket);
        // emmiting event
        // socket.emit('join',{name, room},()=>{//{name : name, room : room} tuongg tu nhu the nay trong es6 vi no cung ten bien nen lam duoc nhu vay
        //     //nhan ham callback tu server khi co loi
        //     // Cai nay chi la demo thoi 
        //     // alert(error);
        // });

        socket.emit('join', { name, room }, async (error) => {
            if(error) {
                alert(error);
            }else{
                const myArry = await getData(); // phai su ly async moi set dc vao Messages
                setMessages(myArry);
            }
        });
        // Gan database vao day vi day la ham chay dau tien va duy nhat 1 lan
        
        return ()=>{
            // Truoc khi thoat thi luu vao DB
            // khi nguoi dung thoat khoi chat thi gui la disconnect
            socket.emit('disconnect');  
            // tat socket
            socket.off();  
        }
    },[ENDPOINT, location.search]); // Chi khi 2 gia tri nay thay doi ta moi chay lai ham nay


    useEffect(()=>{
        socket.on('message',(message)=>{
            // messageFake.push(message);
            setMessages([...messages,message]);
            // messageFake.push(message);
            // setMessages(messageFake);
        });

        socket.on('roomData', ({ users }) => {
            setUsers(users);
          })

        return () => {
            // Truoc khi thoat thi luu vao DB
            socket.emit('disconnect');
            socket.off();
          }
    },[messages]); // chi thay doi khi co nh hown message

    // function for sending messages
    const sendMessage = (event) => {
        event.preventDefault(); // neu ko co no se lam moi ca trang
        if(message) {
          socket.emit('sendMessage', message, () => setMessage(''));
        }
      }

    //   console.log(message,messages);

    return(
        <div className="outerContainer">
        <div className="container">
            <InfoBar room={room} />
            <Messages messages={messages} name={name} />
            <Input message={message} setMessage={setMessage} sendMessage={sendMessage} />
        </div>
        <TextContainer users={users}/>
    </div>
    );
}

export default Chat;