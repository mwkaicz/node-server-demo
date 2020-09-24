
const socket = io('http://192.168.1.233:80'); //POZOR, NUTNO ZMENIT IP!

let pingAddress = document.getElementById('pingAddress');
let output = document.getElementById('console-output');


document.getElementById('cmdLeft').addEventListener('click', function(){
  socket.emit('turnLeft', {});
});

document.getElementById('cmdRight').addEventListener('click', function(){
  socket.emit('turnRight', {});
});

document.getElementById('ping').addEventListener('click', function(){
  socket.emit('provedPrikaz', {
    cmd: 'ping',
    address: pingAddress.value
  });
});

socket.on('novaData', (data) => {
  output.innerHTML = data.val + '\n' + output.innerHTML;
});

socket.on('info', (text) => {
  output.innerHTML = text + '\n' + output.innerHTML;
});