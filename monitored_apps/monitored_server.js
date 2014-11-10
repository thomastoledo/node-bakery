var net = require('net');
var server = net.createServer(function (socket) {
    module.exports.instrument_echo(socket);
});
function echo(socket) {
    socket.write('Echo server\r\n');
    socket.pipe(socket);
}
server.listen(1337, '127.0.0.1');
module.exports = { 

instrument_echo : echo
};