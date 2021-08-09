const Websocket = require('ws');
const LCUConnector  = require('lcu-connector');
const LockfileParser = require('lol-lockfile-parser');
const fetch = require('node-fetch');

const lockfile = new LockfileParser();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;


class Connector extends LCUConnector{
    constructor(executablePath){
        super(executablePath);
        this._ws_events = [];
        this._ws = null;
        this.on('newListener', this._newEventListener);
    }
    _newEventListener(name){
        if (name.charAt(0) === '/'){
            this._ws_events.push(name);
        }
    }
    _fetch(password, port){
        return (method, uri)=> {
            return fetch(`https://127.0.0.1:${port}${uri}`, {method: method, headers: {'Authorization': 'Basic ' + Buffer.from(`riot:${password}`).toString('base64')}})
        }
    }
    _startWSConnection(password, port){
        try {
            this._ws = new Websocket(`wss://riot:${password}@127.0.0.1:${port}/`, {
                rejectUnauthorized: false
            });

            this._ws.on('open', () => {
                this._ws.send(JSON.stringify([5, `OnJsonApiEvent`]));
            });

            this._ws.on('message', (data) => {
                if (data === ""){
                    return;
                }
                let json = JSON.parse(data)[2];
                this.eventNames().forEach((event) =>{
                    if (event.slice(-1) === '/'){
                        if (json.uri.startsWith(event)){
                            this.emit(event, json);
                        }
                    } else {
                        if (json.uri === event){
                            this.emit(event, json);
                        }
                    }
                });
            });

        } catch (err) {
            console.log(err);
        }
    }
    _onFileCreated(path){
        lockfile.read(path).then(data => {
            const result = {
                protocol: data.protocol,
                address: '127.0.0.1',
                port: data.port,
                username: 'riot',
                password: data.password
            };
            this.emit('connect', result, this._fetch(data.password, data.port));
            this._startWSConnection(data.password, data.port);
        });
    }
}

module.exports = Connector;