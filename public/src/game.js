function guid() {
  function s4() {return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);}
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

function getFromCookie(key,defaultValue){
  var value =  Cookies.get(key) ? Cookies.get(key) : defaultValue;
  Cookies.set(key,value);
  return value;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function updatePlayerName(){
  var newName = document.getElementById("myName").value;
  if(newName.length > 10){
    newName =  newName.substr(0,10);
  }
  player.p.name =  newName;
  Cookies.set("name",newName);
}

var names = ["Bob","Shaun","Rudolf","Valera","Petr","Ina","Kate","Eugen","Antuan","Sam","HellFIre","Noob","Jun","Senior","Big boss","Daemon","Paha","Potato","Alina","Max"];
var host = "http://" + document.location.host;
var selfId = getFromCookie("uuid",guid());
var players = [];
var socket = io.connect(host);
var UiPlayers = document.getElementById("players");
var player;

var Q = Quintus({audioSupported: [ 'wav','mp3' ]})
      .include('Sprites, Scenes, Input, 2D, Anim, Touch, UI, Audio')
      .setup({ maximize: true })
      .enableSound()
      .controls().touch();
 
Q.gravityY = 0;
 
var objectFiles = [
  './src/player'
];
 
require(objectFiles, function () {

  document.getElementById("myName").value = getFromCookie("name",names[getRandomInt(0,names.length-1)]);

  function setUp (stage) {
    socket.on('count', function (data) {
      UiPlayers.innerHTML = 'PLAYERS: ' + data['playerCount'];
    });
    
    socket.on('connected', function (data) {
      if (data['tagged']) {
        player = new Q.Player({ playerId: selfId, x: 100, y: 100, socket: socket });
        player.p.sheet = 'enemy'
        player.p.tagged = true;
        stage.insert(player);
      } else {
        player = new Q.Player({ playerId: selfId, x: 100, y: 100, socket: socket });
        stage.insert(player);
        player.trigger('join');
      }

      updatePlayerName()
      player.p.textAbove = new Q.UI.Text({label: player.p.name,color: "black",x: 0,y: 0});

      stage.add('viewport').follow(player);
      stage.insert(player.p.textAbove);
    });

    socket.on('updated', function (data) {
      var actor = players.filter(function (obj) {
        return obj.playerId == data['playerId'];
      })[0];
      if (actor) {
        actor.player.p.name = data['name'];
        actor.player.p.targetX = data['x'];
        actor.player.p.targetY = data['y'];
        actor.player.p.sheet = data['sheet'];
        actor.player.p.opacity = data['opacity'];
        actor.player.p.invincible = data['invincible'];
        actor.player.p.tagged = data['tagged'];
        actor.player.p.update = true;
      } else {
        var temp = new Q.Actor({
          playerId: data['playerId'],
          name: data['name'],
          x: data['x'],
          y: data['y'],
          sheet: data['sheet'],
          opacity: data['opacity'],
          invincible: data['invincible'],
          tagged: data['tagged']
        });
        players.push({ player: temp, playerId: data['playerId'] });

        temp.p.textAbove = new Q.UI.Text({label: "bot",color: "black",x: 0,y: 0});
        stage.insert(temp.p.textAbove);
        stage.insert(temp);
      }
    });
 
    socket.on('tagged', function (data) {
      if (data['playerId'] == selfId) {
        player.p.sheet = 'enemy';
        player.p.tagged = true;
      } else {
        var actor = players.filter(function (obj) {
          return obj.playerId == data['playerId'];
        })[0];
        if (actor) {
          actor.player.p.sheet = 'enemy'
        }
      }
    });
  }

  Q.scene('arena', function (stage) {
    stage.collisionLayer(new Q.TileLayer({ dataAsset: '/maps/arena.json', sheet: 'tiles' }));

    setUp(stage);
  });
 
  var files = [
    '/images/tiles.png',
    '/maps/arena.json',
    '/images/sprites.png',
    '/images/sprites.json'
  ];
 
  Q.load(files.join(','), function () {
    Q.sheet('tiles', '/images/tiles.png', { tilew: 32, tileh: 32 });
    Q.compileSheets('/images/sprites.png', '/images/sprites.json');
    Q.stageScene('arena', 0);
  });
});