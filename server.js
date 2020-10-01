import express from 'express'
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import fs from 'fs'
import http from 'http'
import socketIo from 'socket.io'
import routes from './api/index.js'
let app = express();
var server = http.createServer(app);
var io = socketIo.listen(server);

app.use(express.static(__dirname + '/node_modules'));
app.use(express.static('./config'));
app.use("/says", express.static(__dirname + '/says'));

app.use('/', routes(io));

let port = process.env.PORT || 8888
console.log(`Listening on port ${port}. Go /login to initiate authentication flow.`)
server.listen(port);