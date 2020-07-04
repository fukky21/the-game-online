global.rooms = [];
global.WAITING_STATUS = 0;
global.GAMING_STATUS = 1;

class Player {
  constructor(name) {
    this.status = 0; // 0:ゲーム開始待機中, 1:ゲーム中
    this.name = name;
  }

  get getStatus() {
    return this.status;
  }

  get getPlayerName() {
    return this.name;
  }

  set setStatus(status) {
    this.status = status;
  }
}

class Room {
  constructor(roomId) {
    this.status = 0; // 0:ゲーム開始待機中, 1:ゲーム中
    this.roomId = roomId;
    this.players = [];
  }

  set addPlayer(player) {
    this.players.push(player);
  }

  set removePlayer(name) {
    for(var i=0; i<this.players.length; i++) {
      if(name == this.players[i].getPlayerName) {
        this.players.splice(i, 1); // i番目から1つの要素を削除
        break;
      }
    }
  }

  set setStatus(status) {
    this.status = status;
  }

  get getStatus() {
    return this.status;
  }

  get getRoomId() {
    return this.roomId;
  }

  get getPlayers() {
    return this.players;
  }

  get getPlayerNames() {
    var playerNames = [];
    for(var i=0; i<this.players.length; i++) {
      playerNames.push(this.players[i].getPlayerName);
    }
    return playerNames;
  }
}

global.searchRoom = function(roomId) {
  for(var i=0; i<rooms.length; i++) {
    if(roomId == rooms[i].getRoomId) {
      return rooms[i];
    }
  }
  return -1;
}

global.cleanRoom = function(roomId) {
  for(var i=0; i<rooms.length; i++) {
    if(roomId == rooms[i].getRoomId) {
      rooms.splice(i, 1); // i番目から1つの要素を削除
      return true;
    }
  }
  return false;
}

function issueRoomId() {
  var id = 0;
  var nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  // idには0を除く4桁の数字が入る
  for(var i=0; i<4; i++) {
    id = id * 10 + nums[Math.round(Math.random() * 100)%9];
  }
  if(searchRoom(id) == -1) {
    return id;
  } else {
    // すでにそのidが使われている場合
    issueRoomId();
  }
}

function checkNameDuplicate(room, name) {
  var playerNames = room.getPlayerNames;
  for(var i=0; i<playerNames.length; i++) {
    if(name == playerNames[i]) {
      // 名前が一致してしていたら登録できない
      return false;
    }
  }
  return true;
}

exports.index = function(req, res) {
  res.render('rooms/index');
}

exports.info = function(req, res) {
  res.render('rooms/info');
}

exports.manual = function(req, res) {
  res.render('rooms/manual');
}

exports.makeRoom = function(req, res) {
  res.render('rooms/make_room');
}

exports.enterRoom = function(req, res) {
  res.render('rooms/enter_room');
}

exports.showRoom = function(req, res) {
  var action = req.body.action;
  var name = req.body.name;
  var nameLength = name.trim().length; // trimを使うと空白だけの場合はnameLengthが0になる
  if(action == 'makeRoom') {
    if(0 < nameLength && nameLength < 11) {
      var roomId = issueRoomId();
      var room = new Room(roomId);
      room.addPlayer = new Player(name);
      rooms.push(room);
      res.render('rooms/show_room', {
        roomId: roomId,
        myName: name,
        isHost: true
      });
    } else {
      // nameが空または11文字以上のとき
      var alertMsg = "名前を10文字以下で入力してください";
      res.render('rooms/make_room', {alertMsg: alertMsg});
    }
  } else {
    // enterRoomのとき
    var alertFlag = false;
    var nameAlertMsg;
    var roomAlertMsg;

    // 名前の文字数チェック
    if(!(0 < nameLength && nameLength < 11)) {
      nameAlertMsg = "名前を10文字以下で入力してください";
      alertFlag = true;
    }
    // ルームIDとルーム人数チェック
    var roomId = req.body.roomId;
    var room = searchRoom(Number(roomId));
    if(room == -1) {
      roomAlertMsg = "ルームが見つかりませんでした";
      alertFlag = true;
    } else {
      // ルームが見つかったときは人数チェックをする
      if(room.getPlayers.length == 8) {
        roomAlertMsg = "そのルームは参加人数上限に達しています。"
        alertFlag = true;
      }
    }
    // ルームが見つかり、名前の文字数もOKのとき、重複もチェックする
    if(!alertFlag) {
      if(!checkNameDuplicate(room, name)) {
        nameAlertMsg = "名前が重複しています。別の名前を入力してください。";
        alertFlag = true;
      }
    }
    
    if(alertFlag) {
      res.render('rooms/enter_room', {
        roomAlertMsg: roomAlertMsg,
        nameAlertMsg: nameAlertMsg
      })
    } else {
      room.addPlayer = new Player(name);
      res.render('rooms/show_room', {
        roomId: roomId,
        myName: name,
        isHost: false
      });
    }
  }
}