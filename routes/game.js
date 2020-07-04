global.gameRooms = [];

class GameRoom {
  constructor(roomId, playerNames) {
    this.roomId = roomId;
    this.playerNames = playerNames;
    this.loadCompletedPlayerNum = 0; // 全員のロードが完了してからmainScene作成を行う
    this.deck = createNewDeck();
    this.clearCount = 98; // クリアまでに場に出さなければいけない枚数 0になったときにクリア
    this.passPlayers = []; // 手札がもうないのでパスするプレイヤーのIndexを保持

    // 初期手札をあらかじめ用意しておく(手札を受け取りにくるアクセスが同時にくると、同じdeckを参照してしまう可能性があるから)
    var newMyHands = [];
    for(var i=0; i<playerNames.length; i++) {
      var tmp = [];
      for(var j=0; j<6; j++) {
        tmp.push(this.deck.pop());
      }
      tmp = ascSort(tmp);
      newMyHands.push(tmp);
    }
    this.newMyHands = newMyHands;
  }

  get getRoomId() {
    return this.roomId;
  }
  
  get getPlayerNames() {
    return this.playerNames;
  }

  get getNewMyHands() {
    return this.newMyHands;
  }

  get getDeck() {
    return this.deck;
  }

  set setClearCount(num) {
    this.clearCount = this.clearCount + num;
  }

  get getClearCount() {
    return this.clearCount;
  }

  get getPassPlayers() {
    return this.passPlayers;
  }

  set setPassPlayer(playerIndex) {
    this.passPlayers.push(playerIndex);
  }

  get getLoadCompletedPlayerNum() {
    return this.loadCompletedPlayerNum;
  }

  set addLoadCompletedPlayerNum(num) {
    this.loadCompletedPlayerNum = this.loadCompletedPlayerNum + num;
  }
}

createNewDeck = function() {
  var deck = [];
  for(var i=0; i<98; i++) {
    deck.push(i+2); // 最小のカードは'2'
  }
  return FisherYatesShuffle(deck);
}

FisherYatesShuffle = function(deck) {
  var n = deck.length;
  var copy = deck;
  while(n) {
    var index = Math.floor(Math.random() * n);
    var num = copy[index];
    copy[index] = copy[n-1];
    copy[n-1] = num;
    n--;
  } 
  return copy;
}

global.searchGameRoom = function(roomId) {
  for(var i=0; i<gameRooms.length; i++) {
    if(roomId == gameRooms[i].getRoomId) {
      return gameRooms[i];
    }
  }
  return -1;
}

global.cleanGameRoom = function(roomId) {
  for(var i=0; i<gameRooms.length; i++) {
    if(roomId == gameRooms[i].getRoomId) {
      gameRooms.splice(i, 1); // i番目から1つの要素を削除
      return true;
    }
  }
  return false;
}

global.ascSort = function(arr) {
  return arr.sort(function(a,b) {
    if( a < b ) return -1;
    if( a > b ) return 1;
    return 0;
  });
}

global.checkPassPlayer = function(playerIndex, passPlayers) {
  for(var i=0; i<passPlayers.length; i++) {
    if(passPlayers[i] == playerIndex) {
      return true;
    }
  }
  return false;
}

global.createGameRoom = function(roomId) {
  var room = searchRoom(roomId);
  var playerNames = room.getPlayerNames;
  var gameRoom = new GameRoom(roomId, playerNames);
  gameRooms.push(gameRoom);
}

exports.startGame = function(req, res) {
  // 正規ユーザーであるかどうかをチェックする
  var roomId = req.params.roomId;
  var myName = req.params.myName;
  var room = searchRoom(roomId);
  if(room == -1) {
    // 存在しないルームにアクセスしようとしてきたとき
    res.redirect('/');
  } else if(room.getStatus != GAMING_STATUS) {
    // ホストがGame Startボタンを押していないのにアクセスしようとしてきたとき
    res.redirect('/');
  } else {
    var players = room.getPlayers;
    for(var i=0; i<players.length; i++) {
      if(myName == players[i].getPlayerName && players[i].getStatus == WAITING_STATUS) {
        players[i].setStatus = GAMING_STATUS;
        res.render('games/gaming', {
          roomId: roomId,
          myName: myName,
          myIndex: i,
          isHost: (i == 0) ? true : false
        });
        return;
      }
    }
    // myNameが登録されていなかったとき or 登録されていたがすでにゲーム中のとき
    res.redirect('/');
  }
}