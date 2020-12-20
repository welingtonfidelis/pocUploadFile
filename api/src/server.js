const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server, { cors: { origins: '*' } });
const cors = require('cors');
const fs = require('fs');
const port = 3001;

app.use(cors());

const files = {}
const struct = {
    name: null,
    type: null,
    size: 0,
    data: [],
    slice: 0,
}
const sliceSize = 1000;

io.on('connection', (client) => {
    console.log('CONNECT', client.id);

    client.emit('get-slice-size', { size: sliceSize });

    client.on('slice-upload', (data) => {
        if (!files[data.name]) {
            files[data.name] = Object.assign({}, struct, data);
            files[data.name].data = [];
        }

        data.data = Buffer.from(new Uint8Array(data.data));

        files[data.name].data.push(data.data);
        files[data.name].slice++;

        if (files[data.name].slice * sliceSize >= files[data.name].size) {
            const fileBuffer = Buffer.concat(files[data.name].data);

            fs.writeFile(`./uploaded/${data.name}`, fileBuffer, function (err) {
                delete files[data.name];
                if (err) return client.emit('upload-error');
                client.emit('end-upload');
            });
        }
        else {
            client.emit('request-slice-upload', {
                currentSlice: files[data.name].slice
            });
        }
    });

    client.on('disconnect', _ => {
        console.log('DISCONNECT', client.id);
    });
});

//roteamento
app.get('/test', (_, res) => {
    res.json({ ok: true });
});

server.listen(process.env.PORT || port, function () {
    console.log(`🚀 Server running in ${port}\n`);
});