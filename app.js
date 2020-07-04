var express = require('express'),
    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    favicon = require('serve-favicon'),
    room = require('./routes/room'),
    game = require('./routes/game'),
    logger = require('morgan'),
    bodyParser = require('body-parser'),
    path = require('path');

app.set('views', __dirname + '/views'); // テンプレートファイルの場所を指定
app.set('view engine', 'ejs');

app.use(favicon(path.join(__dirname, 'public', 'favicon.png')));
app.use(logger('dev'));
app.use(bodyParser.json()); // POST処理をするために必要
app.use(bodyParser.urlencoded({extended: true})); // POST処理をするために必要
app.use(express.static(path.join(__dirname, 'public')));

// routing
app.get('/', room.index);
app.get('/index', room.index);
app.get('/info', room.info);
app.get('/manual', room.manual);
app.get('/make_room', room.makeRoom);
app.get('/enter_room', room.enterRoom);
app.post('/show_room', room.showRoom);
app.get('/gaming/:roomId([1-9]{4})/:myName', game.startGame);

/************************************** socket.io ***************************************************/
io.set('heartbeat interval', 5000);
io.set('heartbeat timeout', 15000);

// Roomに関する処理
io.of('/room').on('connection', function(socket) {
  socket.on('socket_connect_request_from_client', function(data) {
    socket.join(`room_${data.roomId}`);
    socket.roomId = data.roomId;
    socket.name = data.myName;
    var playerNames = searchRoom(data.roomId).getPlayerNames;
    socket.emit('player_names_info_from_server', playerNames);
    socket.to(`room_${data.roomId}`).emit('player_names_info_from_server', playerNames);
    console.log(`socket connect: ${data.myName} さんが ${data.roomId} に入室しました`);
  });

  socket.on('disconnect', function(reason) {
    socket.disconnect();
    console.log(`socket disconnect: ${socket.name} さんが room_${socket.roomId} から退出しました`);
    var room = searchRoom(socket.roomId);
    // ホストが離脱したときにルームをクリーンするので、ホスト以外がここへきたときはルームはもう存在しない
    if(room != -1) {
      // game.jsのstartGameにて正規ユーザーであるかどうかの認証ができなくなってしまうので、ゲーム開始後はルームを消去しない
      if(room.getStatus == WAITING_STATUS) {
        // ゲーム開始前
        if(socket.name == room.getPlayerNames[0]) {
          // disconnectしたplayerがホストだったとき、Roomを解散する
          socket.to(`room_${socket.roomId}`).emit('disconnect_host_info_from_server');
          if(cleanRoom(socket.roomId)) {
            console.log(`clean room: room_${socket.roomId} をクリーンしました`);
            console.log(`living rooms: 現在のルーム数は ${rooms.length} です`);
          } else {
            console.log(`clean room failed: room_${socket.roomId} のクリーンに失敗しました`);
            console.log(`living rooms: 現在のルーム数は ${rooms.length} です`);
          }
        } else {
          // disconnectしたplayerがホストではない場合
          room.removePlayer = socket.name;
          var playerNames = room.getPlayerNames;
          socket.to(`room_${socket.roomId}`).emit('player_names_info_from_server', playerNames);
        }
      }
    }
  });

  socket.on('start_game_request_from_client', function(data) {
    // 現在のRoom内人数を確認
    var room = searchRoom(socket.roomId);
    if(room.getPlayerNames.length < 2) {
      // 人数が2人未満ならGameを開始できない
      var alertMsg = "参加人数が2人以上でないと開始できません";
      socket.emit('start_game_response_from_server', {
        startFlag: false,
        alertMsg: alertMsg
      });
    } else {
      // 人数が2人以上ならGameを開始する
      room.setStatus = GAMING_STATUS;
      createGameRoom(socket.roomId);
      socket.emit('start_game_response_from_server', {startFlag: true});
      socket.to(`room_${socket.roomId}`).emit('start_game_response_from_server', {startFlag: true});
      console.log(`GAME START! @ room_${socket.roomId}`);
    }
  });
});

// Gameに関する処理
io.of('/game').on('connection', function(socket) {
  socket.on('load_completed_info_from_client', function(data) {
    socket.join(`game_${data.roomId}`);
    socket.roomId = data.roomId;
    socket.name = data.myName;
    console.log(`socket connect: ${data.myName} さんが ${data.roomId} に入室しました`);
    socket.emit('wating_response_from_server');
    var gameRoom = searchGameRoom(data.roomId);
    gameRoom.addLoadCompletedPlayerNum = 1;
    // 全員揃っていたら開始の合図を出す
    if(gameRoom.getLoadCompletedPlayerNum == gameRoom.getPlayerNames.length) {
      socket.emit('setup_start_info_from_server');
      socket.to(`game_${data.roomId}`).emit('setup_start_info_from_server');
    }
  });

  socket.on('setup_info_request_from_client', function(data) {
    var gameRoom = searchGameRoom(socket.roomId);
    var playerNames = gameRoom.getPlayerNames;
    var newMyHand = gameRoom.getNewMyHands[data];
    socket.emit('setup_info_response_from_server', {
      playerNames: playerNames,
      newMyHand: newMyHand
    });
  });

  socket.on('disconnect', function(reason) {
    socket.disconnect();
    console.log(`socket disconnect: ${socket.name} さんが room_${socket.roomId} から退出しました`);
    var gameRoom = searchGameRoom(socket.roomId);
    // だれかが切断した時点でルームは削除されるので、後から誰かがここへきたときにはルームは既にない
    if(gameRoom != -1) {
      // 誰かが切断してしまったらゲーム終了をクライアントに通知する
      socket.to(`game_${socket.roomId}`).emit('disconnect_player_info_from_server', socket.name);
      if(cleanRoom(socket.roomId) && cleanGameRoom(socket.roomId)) {
        console.log(`clean room: room_${socket.roomId} をクリーンしました`);
        console.log(`living rooms: 現在のルーム数は ${rooms.length} です`);
        console.log(`living gameRooms: 現在のルーム数は ${gameRooms.length} です`);
      } else {
        console.log(`clean room failed: room_${socket.roomId} のクリーンに失敗しました`);
        console.log(`living rooms: 現在のルーム数は ${rooms.length} です`);
        console.log(`living gameRooms: 現在のルーム数は ${gameRooms.length} です`);
      }
    }
  });

  socket.on('surrender_request_from_client', function(data) {
    socket.emit('surrender_info_from_server');
    socket.to(`game_${socket.roomId}`).emit('surrender_info_from_server');
    // RoomとGameRoomを消去する
    if(cleanRoom(socket.roomId) && cleanGameRoom(socket.roomId)) {
      console.log(`clean room: room_${socket.roomId} をクリーンしました`);
      console.log(`living rooms: 現在のルーム数は ${rooms.length} です`);
      console.log(`living gameRooms: 現在のルーム数は ${gameRooms.length} です`);
    } else {
      console.log(`clean room failed: room_${socket.roomId} のクリーンに失敗しました`);
      console.log(`living rooms: 現在のルーム数は ${rooms.length} です`);
      console.log(`living gameRooms: 現在のルーム数は ${gameRooms.length} です`);
    }
  });

  socket.on('first_player_select_info_from_client', function(data) {
    socket.emit('first_player_info_from_server', data);
    socket.to(`game_${socket.roomId}`).emit('first_player_info_from_server', data);
  });

  socket.on('play_card_info_from_client', function(data) {
    var gameRoom = searchGameRoom(socket.roomId);
    // whoにはplayerIndex, whatにはcardNum, whereにはfieldIndexが入っている
    socket.emit('play_card_info_from_server', {
      who: data.who,
      what: data.what,
      where: data.where
    });
    socket.to(`game_${socket.roomId}`).emit('play_card_info_from_server', {
      who: data.who,
      what: data.what,
      where: data.where
    });

    // クリア判定を行う
    gameRoom.setClearCount = -1;
    var clearCount = gameRoom.getClearCount;
    if(clearCount == 0) {
      socket.emit('game_clear_info_from_server');
      socket.to(`game_${socket.roomId}`).emit('game_clear_info_from_server');
      // RoomとGameRoomを消去する
      if(cleanRoom(socket.roomId) && cleanGameRoom(socket.roomId)) {
        console.log(`clean room: room_${socket.roomId} をクリーンしました`);
        console.log(`living rooms: 現在のルーム数は ${rooms.length} です`);
        console.log(`living gameRooms: 現在のルーム数は ${gameRooms.length} です`);
      } else {
        console.log(`clean room failed: room_${socket.roomId} のクリーンに失敗しました`);
        console.log(`living rooms: 現在のルーム数は ${rooms.length} です`);
        console.log(`living gameRooms: 現在のルーム数は ${gameRooms.length} です`);
      }
    }
  });

  socket.on('turn_end_info_from_client', function(data) {
    var gameRoom = searchGameRoom(socket.roomId);
    var deck = gameRoom.getDeck;
    var myIndex = data.myIndex;
    var currentMyHands = data.currentMyHands;
    var drawNum = 0;
    var newMyHands = [];
    // nullの数だけドローする
    for(var i=0; i<currentMyHands.length; i++) {
      if(currentMyHands[i] == null) {
        if(deck.length == 0) {
          // 山札が残っていないときはドローできない
        } else {
          newMyHands.push(deck.pop());
          drawNum++;
        }
      } else {
        // nullでないならそのカードは手札に残す
        newMyHands.push(currentMyHands[i]);
      }
    }
    newMyHands = ascSort(newMyHands);
    // 手札がなくなっていたら、次のターンからpassする
    if(newMyHands.length == 0) {
      gameRoom.setPassPlayer = myIndex;
    }
    // 次のプレイヤーを決める
    var passPlayers = gameRoom.getPassPlayers;
    var playerNames = gameRoom.getPlayerNames;
    var nextPlayerIndex = (Number(myIndex) + 1) % playerNames.length; // 基本的には次のIndexを持つプレイヤー
    while(checkPassPlayer(nextPlayerIndex, passPlayers)) {
      nextPlayerIndex = (nextPlayerIndex + 1) % playerNames.length;
    }
    socket.emit('turn_end_info_from_server', {
      newMyHands: newMyHands,
      deckNum: deck.length,
      who: myIndex,
      drawNum: drawNum,
      nextPlayerIndex: nextPlayerIndex
    });
    socket.to(`game_${socket.roomId}`).emit('turn_end_info_from_server', {
      newMyHands: [],
      deckNum: deck.length,
      who: myIndex,
      drawNum: drawNum,
      nextPlayerIndex: nextPlayerIndex
    });
  });

  socket.on('put_pafe_info_from_client', function(data) {
    // 自分のフィールドにはすでに反映されているので自分以外に通知する
    socket.to(`game_${socket.roomId}`).emit('put_pafe_info_from_server', {
      who: data.who,
      where: data.where
    });
  });

  socket.on('delete_pafe_info_from_client', function(data) {
    // 自分のフィールドにはすでに反映されているので自分以外に通知する
    socket.to(`game_${socket.roomId}`).emit('delete_pafe_info_from_server', data);
  });
});
/****************************************************************************************************/

http.listen(process.env.PORT || 5000, function() {
  console.log("server listening ...");
});
