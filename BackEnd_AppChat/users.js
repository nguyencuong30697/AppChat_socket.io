// quan ly nguoi dung
const users = [];

const addUser= ({id, name, room})=>{
    // xoa het dau cach va chuyen ve chu thuong
    name = name.trim().toLowerCase(); 
    room = room.trim().toLowerCase();

    // kiem tra xem trong mang users da co user voi ten nhu vay chua
    const existingUser = users.find((user) => user.room === room && user.name === name);
    if(!name || !room) return { error: 'Username and room are required.' };
    if(existingUser){
        return { error : 'Username is taken ( ton tai )'};
    }

    const user = {id, name, room};
    users.push(user);

    return { user };
}

const removeUser= (id)=>{
    const index = users.findIndex((user)=> user.id===id);
    if(index !== -1){
        // xoa nguoi dung khoi mang
         return users.splice(index, 1)[0];
    }
}

const getUser= (id)=> users.find((user)=> user.id === id);

const getUsersInRoom= (room)=> users.filter((user) => user.room === room);

module.exports = { addUser, removeUser, getUser, getUsersInRoom };