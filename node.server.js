//https://programmingwithmosh.com/javascript/react-file-upload-proper-server-side-nodejs-easy/
//https://github.com/krissnawat/simple-react-upload

var express = require('express');
var app = express();
var multer = require('multer')
var cors = require('cors');
app.use((req, res, next) => {
	//Qual site tem permissão de realizar a conexão, no exemplo abaixo está o "*" indicando que qualquer site pode fazer a conexão
    res.header("Access-Control-Allow-Origin", "*");
	//Quais são os métodos que a conexão pode realizar na API
    res.header("Access-Control-Allow-Methods", 'GET,PUT,POST,DELETE');
    app.use(cors());
    next();
});

var dataToSendFile = require('./dataToSend')
var dataToSend = dataToSendFile.dataToSend

// create new lcu connector
const LCUConnector = require('./connector');
const connector = new LCUConnector();
const fetch = require('node-fetch');

const fs = require('fs');

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json()

let started=false
let finished=false
let isLCUon=false
let useLCU=false

let serverRes

function dataToJson() {
  const nums = [1, 2, 3, 4, 5]
  let json = require('../overlays/data.json')
  json.started = started
  json.time = dataToSend.time
  json.timestamp = dataToSend.timestamp
  json.phase = dataToSend.phase
  json.actingSide='none'
  for(const side of ['blue','red']){
    for(let [index, num] of nums.entries()){
      let player = dataToSend[side][num]
       if(side==='blue'){
        json.bluePicks[index].championId = player.pick.id;
        json.bluePicks[index].isPicking = player.pick.isDoing;
        json.bluePicks[index].isCompleted = player.pick.done;
        json.bluePicks[index].summonerName = player.name;
        json.bluePicks[index].spellId1 = player.spell1Id;
        json.bluePicks[index].spellId2 = player.spell2Id;
        json.blueBans[index].championId = player.ban.id;
        json.blueBans[index].isActive = player.ban.isDoing;
        json.blueBans[index].isCompleted = player.ban.done;
        if(player.pick.isDoing || player.ban.isDoing){
          json.actingSide='blue'
        }
       }else{
        json.redPicks[index].championId = player.pick.id;
        json.redPicks[index].isPicking = player.pick.isDoing;
        json.redPicks[index].isCompleted = player.pick.done;
        json.redPicks[index].summonerName = player.name;
        json.redPicks[index].spellId1 = player.spell1Id;
        json.redPicks[index].spellId2 = player.spell2Id;
        json.redBans[index].championId = player.ban.id;
        json.redBans[index].isActive = player.ban.isDoing;
        json.redBans[index].isCompleted = player.ban.done;
        if(player.pick.isDoing || player.ban.isDoing){
          json.actingSide='red'
        }
      }
    }

  }
  fs.writeFileSync('./data.json', JSON.stringify(json))
}


function processData(data) {
  if(data.eventType==="Delete"){finished=true; started=false; console.log("cabo")}
  if(data.eventType==="Create"){started=true;finished=false}
  if(data.eventType === "Update"){
    let cellToData = {} 
    for(const team of ['myTeam', 'theirTeam']){
      for (const [i, player] of data.data[team].entries()){
        let side=(team==='myTeam')?'blue':'red'
        let num=i+1
        cellToData[player.cellId] = {side:side, num:num}
        var playerData = dataToSend[side][num]
        playerData.pick.id=(player.championId===0)?-1:player.championId
        playerData.spells[1]=(player.spell1Id>100)?-1:player.spell1Id
        playerData.spells[2]=(player.spell2Id>100)?-1:player.spell2Id
      }
    }
    let blueBanNum=1
    let redBanNum=1
    if (data.data.timer.phase === "BAN_PICK") {
      if (data.data.actions[data.data.actions.length - 1][0].type === "ban") { //BAN PHASE
          dataToSend.phase = "Ban Phase"
      }
      else { //PICK PHASE
        dataToSend.phase = "Pick Phase"
      }
      }
      else {
        dataToSend.phase = ""
      }
      dataToSend.time = Math.trunc(data.data.timer.adjustedTimeLeftInPhase / 1000)
      dataToSend.timestamp = data.data.timer.internalNowInEpochMs
    for(const actions of data.data.actions){
      for(const action of actions){
        let {side, num} = cellToData[action.actorCellId]
        if(action.type === 'pick'){
          if(action.completed){
            dataToSend[side][num]['pick']['done']=true
          }else{
            dataToSend[side][num]['pick']['done']=false
          }
          dataToSend[side][num]['pick']['id']=(action.championId===0)?-1:action.championId
          if(action.championId !== 0 && !action.completed){
            dataToSend[side][num]['pick']['isDoing']=true
          }else{
            dataToSend[side][num]['pick']['isDoing']=false
          }
        } else if (action.type === 'ban') {
            let banNum = (side ==='blue')?blueBanNum++:redBanNum++
            if(action.completed){
              dataToSend[side][num]['ban']['done']=true
            }else{
              dataToSend[side][num]['ban']['done']=false
            }
            dataToSend[side][banNum]['ban']['id']=(action.championId===0)?-1:action.championId
            if(action.championId !== 0 && !action.completed){
              dataToSend[side][num]['ban']['isDoing']=true
            }else{
              dataToSend[side][num]['ban']['isDoing']=false
            }
        }
      }
    }
  }
}

function createData() {
  fetch('http://localhost:3001/data',{
    method: 'get',
    headers: { 'Content-Type': 'application/json' }
  }).then(res => res.json())
  .then(json => {
    serverRes = json
    let idx = 0
    var timer = setInterval(() => {
      if(finished){
        clearInterval(timer)
      }
      if(!finished){
        let data = serverRes[idx]
        processData(data)
        console.log(idx)
        idx++
    }
    }, 950)
    if(finished){
      return
    }
  })
  if(finished){
    return
  }
}

let redMembers =[]
let blueMembers = []

if(useLCU){  
  connector.on('/lol-lobby/v2/lobby/members', (data) => {
    let members = data.data
    redMembers=[]
    blueMembers=[]
   for(const [i, member] of members.entries()) {
      if(member.teamId === 200) {
        redMembers.push(member.summonerName)
      }else{
        blueMembers.push(member.summonerName)
      }
    }
    for(const [i, member] of blueMembers.entries()){
      dataToSend.blue[i+1].name = member
    }
    for(const [i, member] of redMembers.entries()){
      dataToSend.red[i+1].name = member
    }
  })
  connector.on('/lol-champ-select/v1/session', (data) => {
      processData(data)
    });
}else{
  createData();
}
connector.on('connect', async (data, fetch) => {
  let res = await fetch('get', '/lol-summoner/v1/current-summoner');
    if (res.status === 200){
        let data = await res.json();
        console.log(`You are already logged as ${data.displayName}`);
        finished=false
        isLCUon=true
    } else {
        console.log('You are not currently logged. Please log into your account!');
    }
});

connector.on('disconnect', _ =>{
  connector.stop();
});

connector.start();



var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, '../overlays/public/TeamImages')
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname)
	}
})

var upload = multer({ storage: storage }).single('file')

app.get('/', function (req, res) {
	return res.send('Hello Server!')
})

app.get('/data', function (req, res) {
  if(isLCUon) {
  dataToJson();
  let json = require('../overlays/data.json')
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).send(json)
  }else{
    return res.status(500).send('Connect LCU')
  }
})

app.post('/uploadImage', function (req, res) {

	upload(req, res, function (err) {

		if (err instanceof multer.MulterError) {
			return res.status(500).json(err)
			// A Multer error occurred when uploading.
		} else if (err) {
			return res.status(500).json(err)
			// An unknown error occurred when uploading.
		}

		return res.status(200).send(req.file)
		// Everything went fine.
	})
});

app.post('/saveConfig', jsonParser, function (req, res) {
	console.log(req.body)
	fs.writeFile('../overlays/src/Pages/GameState.json', JSON.stringify(req.body), function (err, data) {
		if (err) {
			return res.status(500).json(err)
		}
		return res.status(200).send("OK")
	})
});

app.post('/saveTeam', jsonParser, function (req, res) {
	console.log(req.body)
	fs.writeFile(`../overlays/public/Teams/${req.body.teamName}.json`, JSON.stringify(req.body.info), function (err, data) {
		if (err) {
			return res.status(500).json(err)
		}
		//console.log(data)
		return res.status(200).send("OK")
	})
});

app.get('/teams', function (req, res) {
	let teams = []

	fs.readdir('../overlays/public/Teams', (err, files) => {
		if(files){
    files.forEach(file => {
			teams.push(file);
		})
}
		return res.status(200).send(teams)
	})
});

app.get('/images', function (req, res) {
	let images = []

	fs.readdir('../overlays/public/TeamImages', (err, files) => {
    if(files) {
		files.forEach(file => {
			images.push(file);
		})
  }
		return res.status(200).send(images)
	})
});

app.listen(30061 || process.env.PORT, function () {
	console.log('App running on port 30061');
});