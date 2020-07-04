enchant();

var game;
var myName;
var myIndex;
var isHost;

var isMyTurn = false; // 現在自分のターンかどうか
var isMovingHand = false; // カードを動かしているかどうか
var isMovingPafe = false; // パフェを動かしているかどうか
var isTurnEndButtonEnable = false; // turnEndButtonを有効にするかどうか
var isSurrenderButtonEnable = false; // surrenderButtonを有効にするかどうか

var players = []; // playerの名前を保持する
var playerLabels = []; // 画面右端の残り手札欄の名前ラベルオブジェクトを保持する
var playerCardMinis = []; // 画面右端の残り手札欄のミニカードオブジェクトを保持する2次元配列([[object, object ...], [object, object ...] ...])
var myHands = []; // 手札の情報を保持する2次元配列([[2, object], [10, object] ...])
var fieldNums = [100, 1, 100, 1]; // fieldA-Dに置かれているカードの番号を保持する
var cards = []; // 2-98までの98枚のカードオブジェクトを保持する
var isFieldPafeActive = [false, false, false, false] // fieldPafeはこれがtrueのときに押せるようになる
var firstPlayCard = false;  // 自分のターン内に手札から1枚目を出したかどうか

var windowWidth = 1200;
var windowHeight = 700;
var images = ['/images/action_form.png', '/images/card.png', '/images/fieldA.png', '/images/fieldB.png', '/images/fieldC.png', '/images/fieldD.png', 
              '/images/hands_field.png', '/images/remaining_hands_field.png', '/images/card_mini.png', '/images/turn_end_button.png', 
              '/images/surrender_button.png', '/images/card_2_9.png', '/images/card_10_19.png', '/images/card_20_29.png', '/images/card_30_39.png', 
              '/images/card_40_49.png', '/images/card_50_59.png', '/images/card_60_69.png', '/images/card_70_79.png', '/images/card_80_89.png', 
              '/images/card_90_99.png', '/images/bubble_label.png', '/images/clear_effect.png', '/images/pafe.png'];
var gameOrange = '#ff9932' // currentTurnPlayerLabelなどで使用
var gameRed = '#ff3232'; // fieldAなどで使用
var gameBlue = '#3265ff'; // fieldBなどで使用
var gameYellow = '#ccff32'; // fieldCなどで使用
var gameGreen = '#65ff32'; // fieldDなどで使用
var gamePink = '#ff32cc'; // actionNumberLabelなどで使用
var myHandXPlaces = [82, 199, 317, 435, 553, 671]; // 手札欄の各ポケットのX座標
var myHandYPlace = 522; // 手札欄のポケットのY座標
var INDEX_FIELD_A = 0;
var INDEX_FIELD_B = 1;
var INDEX_FIELD_C = 2;
var INDEX_FIELD_D = 3;

var core;
var mainScene;
var currentTurnPlayerLabel;
var actionFieldLabel;
var actionNumberLabel;
var deck;
var deckRemainingLabel;
var fieldA;
var fieldPafeA;
var fieldPafeLabelA;
var fieldNumA;
var fieldB;
var fieldPafeB;
var fieldPafeLabelB;
var fieldNumB;
var fieldC;
var fieldPafeC;
var fieldPafeLabelC;
var fieldNumC;
var fieldD;
var fieldPafeD;
var fieldPafeLabelD;
var fieldNumD;
var turnEndButton;
var surrenderButton;

// 2-99(98枚)のカードオブジェクトを作成する
setupCards = function() {
  // 2-9(8枚)
  for(var i=0; i<8; i++) {
    var card = new Sprite(100, 150);
    card.image = core.assets['/images/card_2_9.png'];
    card.frame = i;
    cards.push(card);
  }
  // 10-99(90枚)
  for(var i=1; i<10; i++) {
    for(var j=0; j<10; j++) {
      var card = new Sprite(100, 150);
      card.image = core.assets[`/images/card_${i}0_${i}9.png`];
      card.frame = j;
      cards.push(card);
    }
  }
}

// ゲーム画面の表示をセンタリング
moveStageToCenter = function(core) {
  var stagePos = {
    top: (window.innerHeight - (core.height * core.scale)) / 2,
    left: (window.innerWidth - (core.width * core.scale)) / 2,
  }
  var stage = document.getElementById('enchant-stage');
  stage.style.position = 'absolute';
  stage.style.top = stagePos.top + 'px';
  stage.style.left = stagePos.left + 'px';
  core._pageX = stagePos.left;
  core._pageY = stagePos.top;
}

// カードを動かす処理を追加
addEventListenerToMyHand = function(myHand) {
  // 手札をドラッグ&ドロップで移動できるようにする
  myHand.addEventListener('touchstart', function(e) {
    for(var i=0; i<6; i++) {
      // 移動開始場所をmoveStartPlaceに保存する
      // 正規のスタート地点でなければ、移動を許可しない
      // tl.moveToを使った後の座標が小数点値になるので、Math.roundで四捨五入してから判定する
      if(Math.round(this.x) == myHandXPlaces[i] && Math.round(this.y) == myHandYPlace) {
        moveStartPlace = i; // 各手札欄の番号, 左端から0-5まで
        originX = e.x - this.x;
        originY = e.y - this.y;
        isMovingHand = true;
        break;
      }
    }
  });
  myHand.addEventListener('touchmove', function(e) {
    if(isMovingHand) {
      this.x = e.x - originX;
      this.y = e.y - originY;
    }
  });
  myHand.addEventListener('touchend', function(e) { 
    if(isMovingHand) {
      checkMoveEndPlace(this, moveStartPlace);
      isMovingHand = false;
    }
  });
}

// パフェを動かす処理を追加
addEventListenerToMyPafe = function(myPafe) {
  // 手札をドラッグ&ドロップで移動させることができるようにする
  myPafe.addEventListener('touchstart', function(e) {
    // 正規の位置にあるかどうかチェックする
    if(Math.round(this.x) == 65 && Math.round(this.y) == 217) {
      originX = e.x - this.x;
      originY = e.y - this.y;
      isMovingPafe = true;
    }
  });
  myPafe.addEventListener('touchmove', function(e) {
    if(isMovingPafe) {
      this.x = e.x - originX;
      this.y = e.y - originY;
    }
  });
  myPafe.addEventListener('touchend', function(e) { 
    if(isMovingPafe) {
      if(this.within(fieldA, 70)) {
        fieldPafeA.opacity = 0.4;
        fieldPafeLabelA.text = myName;
        fieldPafeLabelA.opacity = 0.4;
        isFieldPafeActive[INDEX_FIELD_A] = true;
        // serverにパフェ設置を通知
        game.emit('put_pafe_info_from_client', {
          who: myIndex,
          where: INDEX_FIELD_A
        });
        // 元の位置に戻す(アニメーションなし)
        this.x = 65;
        this.y = 217;
      } else if(this.within(fieldB, 70)) {
        fieldPafeB.opacity = 0.4;
        fieldPafeLabelB.text = myName;
        fieldPafeLabelB.opacity = 0.4;
        isFieldPafeActive[INDEX_FIELD_B] = true;
        // serverにパフェ設置を通知
        game.emit('put_pafe_info_from_client', {
          who: myIndex,
          where: INDEX_FIELD_B
        });
        // 元の位置に戻す(アニメーションなし)
        this.x = 65;
        this.y = 217;
      } else if(this.within(fieldC, 70)) {
        fieldPafeC.opacity = 0.4;
        fieldPafeLabelC.text = myName;
        fieldPafeLabelC.opacity = 0.4;
        isFieldPafeActive[INDEX_FIELD_C] = true;
        // serverにパフェ設置を通知
        game.emit('put_pafe_info_from_client', {
          who: myIndex,
          where: INDEX_FIELD_C
        });
        // 元の位置に戻す(アニメーションなし)
        this.x = 65;
        this.y = 217;
      } else if(this.within(fieldD, 70)) {
        fieldPafeD.opacity = 0.4;
        fieldPafeLabelD.text = myName;
        fieldPafeLabelD.opacity = 0.4;
        isFieldPafeActive[INDEX_FIELD_D] = true;
        // serverにパフェ設置を通知
        game.emit('put_pafe_info_from_client', {
          who: myIndex,
          where: INDEX_FIELD_D
        });
        // 元の位置に戻す(アニメーションなし)
        this.x = 65;
        this.y = 217;
      } else {
        // 元の位置に戻す(アニメーションあり)
        this.tl.moveTo(65, 217, 10);
      }
      isMovingHand = false;
    }
  });
}

// currentTurnPlayerLabelとplayerLabel(画面右端のラベル)を変更する
changePlayerLabels =  function(prevPlayerIndex, nextPlayerIndex) {
  // 1つ前のplayerLabelの色を元に戻す
  playerLabels[prevPlayerIndex].color = '#000000';
  // 次のplayerのための変更
  currentTurnPlayerLabel.text = players[nextPlayerIndex];
  playerLabels[nextPlayerIndex].color = gameOrange;

}

// 手札を場に出す処理
// カード位置をアニメーション付きで補正 & actionFormとfieldNumの表示を更新 & オブジェクトをmainSceneから除去 & serverに通知
playCard = function(myHand, fieldIndex, cardNum) {
  // アニメーションが終わった後に0.8秒空けてから色々な処理を行いたいので、非同期処理で書く
  const promise = new Promise((resolve, reject) => {
    // カード位置を補正
    switch(fieldIndex) {
      case INDEX_FIELD_A:
        myHand.tl.moveTo(313, 61, 10);
        break;
      case INDEX_FIELD_B:
        myHand.tl.moveTo(313, 291, 10);
        break;
      case INDEX_FIELD_C:
        myHand.tl.moveTo(685, 61, 10);
        break;
      case INDEX_FIELD_D:
        myHand.tl.moveTo(685, 291, 10);
        break;
    }
    // 0.8秒空ける
    setTimeout(() => { 
      resolve();
    }, 800);
  });
  promise.then(() => {
    // actionFormとfieldNumの表示を更新
    changeActionFormAndFieldNumDisplay(fieldIndex, cardNum);
    // 各種イベントをclearしたのちにmainSceneから除去
    myHand.clearEventListener('touchstart');
    myHand.clearEventListener('touchmove');
    myHand.clearEventListener('touchend');
    mainScene.removeChild(myHand);
    // カードを出したことをserverに通知する
    game.emit('play_card_info_from_client', {
      who: myIndex,
      what: cardNum,
      where: fieldIndex
    });

    for(var i=0; i<myHands.length; i++) {
      if(cardNum == myHands[i][0]) {
        myHands[i] = [null, null]; // カードを出し終わったらこの状態にする
      }
    }
  });
}

// 手札を離した位置から場所を確定・補正する & 配置可能かどうか判定する & serverに配置内容を送信する
checkMoveEndPlace = function(myHand, moveStartPlace) {
  if(myHand.within(fieldA, 70) && isMyTurn) {
    if(myHands[moveStartPlace][0] < fieldNums[INDEX_FIELD_A] || myHands[moveStartPlace][0] == fieldNums[INDEX_FIELD_A] + 10) {
      playCard(myHand, INDEX_FIELD_A, myHands[moveStartPlace][0]);
    } else {
      // 元の位置に戻す
      myHand.tl.moveTo(myHandXPlaces[moveStartPlace], myHandYPlace, 10);
    }
  } else if(myHand.within(fieldB, 70) && isMyTurn) {
    if(myHands[moveStartPlace][0] > fieldNums[INDEX_FIELD_B] || myHands[moveStartPlace][0] == fieldNums[INDEX_FIELD_B] - 10) {
      playCard(myHand, INDEX_FIELD_B, myHands[moveStartPlace][0]);
    } else {
      // 元の位置に戻す
      myHand.tl.moveTo(myHandXPlaces[moveStartPlace], myHandYPlace, 10);
    }
  } else if(myHand.within(fieldC, 70) && isMyTurn) {
    if(myHands[moveStartPlace][0] < fieldNums[INDEX_FIELD_C] || myHands[moveStartPlace][0] == fieldNums[INDEX_FIELD_C] + 10) {
      playCard(myHand, INDEX_FIELD_C, myHands[moveStartPlace][0]);
    } else {
      // 元の位置に戻す
      myHand.tl.moveTo(myHandXPlaces[moveStartPlace], myHandYPlace, 10);
    }
  } else if(myHand.within(fieldD, 70) && isMyTurn) {
    if(myHands[moveStartPlace][0] > fieldNums[INDEX_FIELD_D] || myHands[moveStartPlace][0] == fieldNums[INDEX_FIELD_D] - 10) {
      playCard(myHand, INDEX_FIELD_D, myHands[moveStartPlace][0]);
    } else {
      // 元の位置に戻す
      myHand.tl.moveTo(myHandXPlaces[moveStartPlace], myHandYPlace, 10);
    }
  } else {
    // 元の位置に戻す
    myHand.tl.moveTo(myHandXPlaces[moveStartPlace], myHandYPlace, 10);
  }
}

// cardMiniの表示枚数を変更する
changeCardMiniDisplay = function(playerIndex, change) {
  if(change == -1) {
    // 1枚カードを出したとき
    var removedCardMini = playerCardMinis[playerIndex].pop();
    mainScene.removeChild(removedCardMini);
  } else if(0 < change) {
    // カードをドローしたとき
    var numBeforeDraw = playerCardMinis[playerIndex].length; // ドロー前の手札枚数を確認
    for(var i=0; i<change; i++) {
      var cardMini = new Sprite(20, 30);
      cardMini.image = core.assets['/images/card_mini.png'];
      cardMini.x = 1050 + 23 * (numBeforeDraw + i);
      cardMini.y = 51 + 35 * playerIndex;
      mainScene.addChild(cardMini);
      playerCardMinis[playerIndex].push(cardMini);
    }
  }
}

// actionFormとfieldNumの表示を変更する
changeActionFormAndFieldNumDisplay =  function(fieldIndex, cardNum) {
  actionNumberLabel.text = `${cardNum}`;
  fieldNums[fieldIndex] = cardNum;
  switch(fieldIndex) {
    case INDEX_FIELD_A:
      actionFieldLabel.text = 'A';
      actionFieldLabel.color = gameRed;
      fieldNumA.text = `${cardNum}`;
      break;
    case INDEX_FIELD_B:
      actionFieldLabel.text = 'B';
      actionFieldLabel.color = gameBlue;
      fieldNumB.text = `${cardNum}`;
      break;
    case INDEX_FIELD_C:
      actionFieldLabel.text = 'C';
      actionFieldLabel.color = gameYellow;
      fieldNumC.text = `${cardNum}`;
      break;  
    case INDEX_FIELD_D:
      actionFieldLabel.text = 'D';
      actionFieldLabel.color = gameGreen;
      fieldNumD.text = `${cardNum}`;
      break;
  }
}

// 手札を更新する
changeMyHandsDisplay = function(newMyHands) {
  // 以前の手札をmainSceneから除去する
  $.each(myHands, function(index, val) {
    if(val[0] != null) {
      var removedMyHand = val[1];
      // 各イベントをclearしてから除去する
      removedMyHand.clearEventListener('touchstart');
      removedMyHand.clearEventListener('touchmove');
      removedMyHand.clearEventListener('touchend');
      mainScene.removeChild(removedMyHand);
    }
  });
  myHands = []; // myHandsをクリア
  // 新しく手札を並べる
  $.each(newMyHands, function(index, val) {
    var myHand = cards[val-2]; // '2'のカードはcards[0]に入っている
    myHand.x = myHandXPlaces[index];
    myHand.y = myHandYPlace;
    addEventListenerToMyHand(myHand);
    myHands.push([val, myHand]);
    mainScene.addChild(myHand);
  });
}

// 山札の枚数を変更する
changeDeckDisplay = function(numAfterDraw) {
  deckRemainingLabel.text = `残り${numAfterDraw}枚`;
  if(numAfterDraw == 0) {
    deck.opacity = 0; // 山札カードを消す
  }
}

// サーバーと通信ができないときに表示される画面
createCommunicationErrorScene = function() {
  var scene = new Scene();
  scene.backgroundColor = '#000000';

  var label = new Label('COMMUNICATION ERROR');
  label.textAlign = 'center';
  label.color = '#ffffff';
  label.font = '60px sans-serif';
  label.width = 1000;
  label.x = (windowWidth - 1000) / 2;
  label.y = 184;
  scene.addChild(label);

  var subLabel = new Label('サーバーと通信ができません。ウィンドウを閉じて終了してください。');
  subLabel.textAlign = 'center';
  subLabel.color = '#ffffff';
  subLabel.font = '30px sans-serif';
  subLabel.width = 1000;
  subLabel.x = (windowWidth - 1000) / 2;
  subLabel.y = 384;
  scene.addChild(subLabel);

  return scene;
}

// 誰かがdisconnectしたときにゲーム終了を通知する画面
createDisconnectNotifyScene = function(name) {
  var scene = new Scene();
  scene.backgroundColor = 'rgba(0, 0, 0, 0.4)';

  var label = new Label(`${name} さんとの通信が切断されました。`);
  label.textAlign = 'center';
  label.color = '#ffffff';
  label.font = '30px sans-serif';
  label.width = 1000;
  label.x = (windowWidth - 1000) / 2;
  label.y = windowHeight / 2 - 100;
  scene.addChild(label);

  var label2 = new Label("ゲームを終了します。");
  label2.textAlign = 'center';
  label2.color = '#ffffff';
  label2.font = '30px sans-serif';
  label2.width = 500;
  label2.x = (windowWidth - 500) / 2;
  label2.y = windowHeight / 2;
  scene.addChild(label2);

  var label3 = new Label("5秒後にタイトル画面に戻ります。");
  label3.textAlign = 'center';
  label3.color = '#ffffff';
  label3.font = '30px sans-serif';
  label3.width = 1000;
  label3.x = (windowWidth - 1000) / 2;
  label3.y = windowHeight / 2 + 100;
  scene.addChild(label3);

  return scene;
}

// 参加者全員がサーバーに接続するのを待つ画面
createWaitingSetupInfoScene = function() {
  var scene = new Scene();
  scene.backgroundColor = 'rgba(0, 0, 0, 0.4)';
  var label = new Label('通信待機中・・・');
  label.textAlign = 'center';
  label.color = '#ffffff';
  label.font = '30px sans-serif';
  label.width = 500;
  label.x = (windowWidth - 500) / 2;
  label.y = windowHeight / 2 - 60;
  scene.addChild(label);

  var subLabel = new Label('※しばらくしてもこのままの場合は画面を閉じて終了してください');
  subLabel.textAlign = 'center';
  subLabel.color = '#ffffff';
  subLabel.font = '20px sans-serif';
  subLabel.width = 1000;
  subLabel.x = (windowWidth - 1000) / 2;
  subLabel.y = windowHeight / 2 + 60;
  scene.addChild(subLabel);

  return scene;
}

// メインゲーム画面
createMainScene = function(firstMyHands) {
  var scene = new Scene();
  scene.backgroundColor = '#ffffff';

  currentTurnPlayerLabel = new Label('---');
  currentTurnPlayerLabel.color = gameOrange;
  currentTurnPlayerLabel.font = '30px sans-serif';
  currentTurnPlayerLabel.x = 30;
  currentTurnPlayerLabel.y = 20;
  scene.addChild(currentTurnPlayerLabel);

  var currentTurnPlayerSubLabel = new Label('さんのターンです');
  currentTurnPlayerSubLabel.color = '#000000';
  currentTurnPlayerSubLabel.font = '20px sans-serif';
  currentTurnPlayerSubLabel.x = 30;
  currentTurnPlayerSubLabel.y = 55;
  scene.addChild(currentTurnPlayerSubLabel);

  var actionForm = new Sprite(150, 50);
  actionForm.image = core.assets['/images/action_form.png'];
  actionForm.x = 30;
  actionForm.y = 80;
  scene.addChild(actionForm);

  actionFieldLabel = new Label('');
  actionFieldLabel.font = '20px sans-serif';
  actionFieldLabel.textAlign = 'center';
  actionFieldLabel.width = 20;
  actionFieldLabel.x = 65;
  actionFieldLabel.y = 100;
  scene.addChild(actionFieldLabel);

  actionNumberLabel = new Label('');
  actionNumberLabel.color = gamePink;
  actionNumberLabel.font = '20px sans-serif';
  actionNumberLabel.textAlign = 'center';
  actionNumberLabel.width = 30;
  actionNumberLabel.x = 115;
  actionNumberLabel.y = 100;
  scene.addChild(actionNumberLabel);

  deck = new Sprite(100, 150);
  deck.image = core.assets['/images/card.png'];
  deck.x = 500;
  deck.y = 175;
  scene.addChild(deck);

  var deckLabel = new Label('山札');
  deckLabel.color = '#000000';
  deckLabel.font = '20px sans-serif';
  deckLabel.textAlign = 'center';
  deckLabel.width = 100;
  deckLabel.x = 500;
  deckLabel.y = 155;
  scene.addChild(deckLabel);

  deckRemainingLabel = new Label(`残り${98 - 6 * players.length}枚`);
  deckRemainingLabel.color = '#000000';
  deckRemainingLabel.font = '20px sans-serif';
  deckRemainingLabel.textAlign = 'center';
  deckRemainingLabel.width = 100;
  deckRemainingLabel.x = 500;
  deckRemainingLabel.y = 328;
  scene.addChild(deckRemainingLabel);

  fieldA = new Sprite(123, 180);
  fieldA.image = core.assets['/images/fieldA.png'];
  fieldA.x = 300;
  fieldA.y = 48;
  scene.addChild(fieldA);

  var fieldATopLabel = new Label('2 ← 100');
  fieldATopLabel.color = gameRed;
  fieldATopLabel.font = '15px sans-serif';
  fieldATopLabel.textAlign = 'center';
  fieldATopLabel.width = 100;
  fieldATopLabel.x = 316;
  fieldATopLabel.y = 30;
  scene.addChild(fieldATopLabel);

  var fieldASideLabel = new Label('A');
  fieldASideLabel.color = gameRed;
  fieldASideLabel.font = '15px sans-serif';
  fieldASideLabel.textAlign = 'center';
  fieldASideLabel.width = 30;
  fieldASideLabel.x = 424;
  fieldASideLabel.y = 128;
  scene.addChild(fieldASideLabel);

  fieldPafeA = new Sprite(93, 200);
  fieldPafeA.image = core.assets['/images/pafe.png'];
  fieldPafeA.x = 316;
  fieldPafeA.y = 35;
  fieldPafeA.opacity = 0;
  fieldPafeA.addEventListener('touchstart', function() {
    if(isFieldPafeActive[INDEX_FIELD_A]) {
      this.opacity = 0;
      fieldPafeLabelA.text = '';
      fieldPafeLabelA.opacity = 0;
      // serverにPafeを消したことを通知
      game.emit('delete_pafe_info_from_client', INDEX_FIELD_A);
      isFieldPafeActive[INDEX_FIELD_A] = false;
    }
  });
  scene.addChild(fieldPafeA);

  fieldPafeLabelA = new Label('');
  fieldPafeLabelA.color = '#000000';
  fieldPafeLabelA.font = '10px sans-serif';
  fieldPafeLabelA.x = 385;
  fieldPafeLabelA.y = 201;
  fieldPafeLabelA.opacity = 0;
  scene.addChild(fieldPafeLabelA);

  fieldNumA = new Label('');
  fieldNumA.color = gamePink;
  fieldNumA.font = '50px sans-serif';
  fieldNumA.textAlign = 'center';
  fieldNumA.width = 100;
  fieldNumA.x = 313;
  fieldNumA.y = 114;
  scene.addChild(fieldNumA);

  fieldB = new Sprite(123, 180);
  fieldB.image = core.assets['/images/fieldB.png'];
  fieldB.x = 300;
  fieldB.y = 273;
  scene.addChild(fieldB);

  var fieldBBottomLabel = new Label('1 → 99');
  fieldBBottomLabel.color = gameBlue;
  fieldBBottomLabel.font = '15px sans-serif';
  fieldBBottomLabel.textAlign = 'center';
  fieldBBottomLabel.width = 100;
  fieldBBottomLabel.x = 313;
  fieldBBottomLabel.y = 457;
  scene.addChild(fieldBBottomLabel);

  var fieldBSideLabel = new Label('B');
  fieldBSideLabel.color = gameBlue;
  fieldBSideLabel.font = '15px sans-serif';
  fieldBSideLabel.textAlign = 'center';
  fieldBSideLabel.width = 30;
  fieldBSideLabel.x = 424;
  fieldBSideLabel.y = 354;
  scene.addChild(fieldBSideLabel);

  fieldPafeB = new Sprite(93, 200);
  fieldPafeB.image = core.assets['/images/pafe.png'];
  fieldPafeB.x = 316;
  fieldPafeB.y = 261;
  fieldPafeB.opacity = 0;
  fieldPafeB.addEventListener('touchstart', function() {
    if(isFieldPafeActive[INDEX_FIELD_B]) {
      this.opacity = 0;
      fieldPafeLabelB.text = '';
      fieldPafeLabelB.opacity = 0;
      // serverにPafeを消したことを通知
      game.emit('delete_pafe_info_from_client', INDEX_FIELD_B);
      isFieldPafeActive[INDEX_FIELD_B] = false;
    }
  });
  scene.addChild(fieldPafeB);

  fieldPafeLabelB = new Label('');
  fieldPafeLabelB.color = '#000000';
  fieldPafeLabelB.font = '10px sans-serif';
  fieldPafeLabelB.x = 385;
  fieldPafeLabelB.y = 428;
  fieldPafeLabelB.opacity = 0;
  scene.addChild(fieldPafeLabelB);

  fieldNumB = new Label('');
  fieldNumB.color = gamePink;
  fieldNumB.font = '50px sans-serif';
  fieldNumB.textAlign = 'center';
  fieldNumB.width = 100;
  fieldNumB.x = 313;
  fieldNumB.y = 340;
  scene.addChild(fieldNumB);

  fieldC = new Sprite(123, 180);
  fieldC.image = core.assets['/images/fieldC.png'];
  fieldC.x = 673;
  fieldC.y = 48;
  scene.addChild(fieldC);

  var fieldCTopLabel = new Label('2 ← 100');
  fieldCTopLabel.color = gameYellow;
  fieldCTopLabel.font = '15px sans-serif';
  fieldCTopLabel.textAlign = 'center';
  fieldCTopLabel.width = 100;
  fieldCTopLabel.x = 688;
  fieldCTopLabel.y = 30;
  scene.addChild(fieldCTopLabel);

  var fieldCSideLabel = new Label('C');
  fieldCSideLabel.color = gameYellow;
  fieldCSideLabel.font = '15px sans-serif';
  fieldCSideLabel.textAlign = 'center';
  fieldCSideLabel.width = 30;
  fieldCSideLabel.x = 642;
  fieldCSideLabel.y = 128;
  scene.addChild(fieldCSideLabel);

  fieldPafeC = new Sprite(93, 200);
  fieldPafeC.image = core.assets['/images/pafe.png'];
  fieldPafeC.x = 690;
  fieldPafeC.y = 35;
  fieldPafeC.opacity = 0;
  fieldPafeC.addEventListener('touchstart', function() {
    if(isFieldPafeActive[INDEX_FIELD_C]) {
      this.opacity = 0;
      fieldPafeLabelC.text = '';
      fieldPafeLabelC.opacity = 0;
      // serverにPafeを消したことを通知
      game.emit('delete_pafe_info_from_client', INDEX_FIELD_C);
      isFieldPafeActive[INDEX_FIELD_C] = false;
    }
  });
  scene.addChild(fieldPafeC);

  fieldPafeLabelC = new Label('');
  fieldPafeLabelC.color = '#000000';
  fieldPafeLabelC.font = '10px sans-serif';
  fieldPafeLabelC.x = 758;
  fieldPafeLabelC.y = 201;
  fieldPafeLabelC.opacity = 0;
  scene.addChild(fieldPafeLabelC);

  fieldNumC = new Label('');
  fieldNumC.color = gamePink;
  fieldNumC.font = '50px sans-serif';
  fieldNumC.textAlign = 'center';
  fieldNumC.width = 100;
  fieldNumC.x = 686;
  fieldNumC.y = 114;
  scene.addChild(fieldNumC);

  fieldD = new Sprite(123, 180);
  fieldD.image = core.assets['/images/fieldD.png'];
  fieldD.x = 673;
  fieldD.y = 273;
  scene.addChild(fieldD);

  var fieldDBottomLabel = new Label('1 → 99');
  fieldDBottomLabel.color = gameGreen;
  fieldDBottomLabel.font = '15px sans-serif';
  fieldDBottomLabel.textAlign = 'center';
  fieldDBottomLabel.width = 100;
  fieldDBottomLabel.x = 686;
  fieldDBottomLabel.y = 457;
  scene.addChild(fieldDBottomLabel);

  var fieldDSideLabel = new Label('D');
  fieldDSideLabel.color = gameGreen;
  fieldDSideLabel.font = '15px sans-serif';
  fieldDSideLabel.textAlign = 'center';
  fieldDSideLabel.width = 30;
  fieldDSideLabel.x = 642;
  fieldDSideLabel.y = 354;
  scene.addChild(fieldDSideLabel);

  fieldPafeD = new Sprite(93, 200);
  fieldPafeD.image = core.assets['/images/pafe.png'];
  fieldPafeD.x = 690;
  fieldPafeD.y = 261;
  fieldPafeD.opacity = 0;
  fieldPafeD.addEventListener('touchstart', function() {
    if(isFieldPafeActive[INDEX_FIELD_D]) {
      this.opacity = 0;
      fieldPafeLabelD.text = '';
      fieldPafeLabelD.opacity = 0;
      // serverにPafeを消したことを通知
      game.emit('delete_pafe_info_from_client', INDEX_FIELD_D);
      isFieldPafeActive[INDEX_FIELD_D] = false;
    }
  });
  scene.addChild(fieldPafeD);

  fieldPafeLabelD = new Label('');
  fieldPafeLabelD.color = '#000000';
  fieldPafeLabelD.font = '10px sans-serif';
  fieldPafeLabelD.x = 758;
  fieldPafeLabelD.y = 428;
  fieldPafeLabelD.opacity = 0;
  scene.addChild(fieldPafeLabelD);

  fieldNumD = new Label('');
  fieldNumD.color = gamePink;
  fieldNumD.font = '50px sans-serif';
  fieldNumD.textAlign = 'center';
  fieldNumD.width = 100;
  fieldNumD.x = 686;
  fieldNumD.y = 340;
  scene.addChild(fieldNumD);

  var handsField = new Sprite(810, 206);
  handsField.image = core.assets['/images/hands_field.png'];
  handsField.x = 0;
  handsField.y = 494;
  scene.addChild(handsField);

  var remainingHandsField = new Sprite(300, 353);
  remainingHandsField.image = core.assets['/images/remaining_hands_field.png'];
  remainingHandsField.x = windowWidth - 300;
  remainingHandsField.y = 0;
  scene.addChild(remainingHandsField);

  $.each(players, function(index, val){
    var playerLabel = new Label(val);
    playerLabel.color = '#000000';
    playerLabel.font = '12px sans-serif';
    playerLabel.width = 100;
    playerLabel.x = 930;
    playerLabel.y = 60 + 35 * index;
    playerLabels.push(playerLabel);
    scene.addChild(playerLabel);

    var tmpArr = [];
    for(var i=0; i<6; i++) {
      var cardMini = new Sprite(20, 30);
      cardMini.image = core.assets['/images/card_mini.png'];
      cardMini.x = 1050 + 23 * i;
      cardMini.y = 51 + 35 * index;
      scene.addChild(cardMini);
      tmpArr.push(cardMini);
    }
    playerCardMinis.push(tmpArr);
  });

  turnEndButton = new Sprite(250, 127);
  turnEndButton.image = core.assets['/images/turn_end_button.png'];
  turnEndButton.x = 900;
  turnEndButton.y = 400;
  turnEndButton.opacity = 0.2;
  turnEndButton.addEventListener('touchstart', function(e) {
    if(isTurnEndButtonEnable) {
      turnEndButton.opacity = 0.2;
      surrenderButton.opacity = 0.2;
      isTurnEndButtonEnable = false;
      isSurrenderButtonEnable = false;
      // ターンエンドをserverに通知する
      var currentMyHands = [];
      $.each(myHands, function(index, val) {
        currentMyHands.push(val[0]);
      });
      game.emit('turn_end_info_from_client', {
        myIndex: myIndex,
        currentMyHands: currentMyHands
      });
    }
  });
  scene.addChild(turnEndButton);

  surrenderButton = new Sprite(250, 127);
  surrenderButton.image = core.assets['/images/surrender_button.png'];
  surrenderButton.x = 900;
  surrenderButton.y = 550;
  surrenderButton.opacity = 0.2;
  surrenderButton.addEventListener('touchstart', function(e) {
    if(isSurrenderButtonEnable) {
      // 降参確認画面を出す
      core.pushScene(createSurrenderConfirmScene());
    }
  });
  scene.addChild(surrenderButton);

  $.each(firstMyHands, function(index, val) {
    var myHand = cards[val-2]; // '2'のカードはcards[0]に入っている
    myHand.x = myHandXPlaces[index];
    myHand.y = myHandYPlace;
    addEventListenerToMyHand(myHand);
    myHands.push([val, myHand]);
    scene.addChild(myHand);
  });

  var myPafeLabel = new Label('アピールいちごパフェ');
  myPafeLabel.color = '#000000';
  myPafeLabel.font = '15px sans-serif';
  myPafeLabel.x = 40;
  myPafeLabel.y = 185;
  scene.addChild(myPafeLabel);
  
  var myPafe = new Sprite(93, 200);
  myPafe.image = core.assets['/images/pafe.png'];
  myPafe.x = 65;
  myPafe.y = 217;
  addEventListenerToMyPafe(myPafe);
  scene.addChild(myPafe);

  return scene;
}

// 誰から始めるかを選択する画面
createSelectFirstPlayerScene = function() {
  var scene = new Scene();
  scene.backgroundColor = 'rgba(0, 0, 0, 0.4)';

  var selectedPlayer = 0;
  var playerSelectLabels = [];

  var titleLabel = new Label('誰からStartしますか？');
  titleLabel.textAlign = 'center';
  titleLabel.color = '#ffffff';
  titleLabel.font = '30px sans-serif';
  titleLabel.width = 400;
  titleLabel.x = (windowWidth - 400) / 2;
  titleLabel.y = 40;
  scene.addChild(titleLabel);

  var subTitleLabel = new Label('名前をクリックして選択してください');
  subTitleLabel.textAlign = 'center';
  subTitleLabel.color = '#ffffff';
  subTitleLabel.font = '30px sans-serif';
  subTitleLabel.width = 600;
  subTitleLabel.x = (windowWidth - 600) / 2;
  subTitleLabel.y = 80;
  scene.addChild(subTitleLabel);

  $.each(players, function(index, val){
    var playerLabel = new Label(val);
    if(index == 0) {
      playerLabel.color = gameOrange;
    } else {
      playerLabel.color = '#ffffff';
    }
    playerLabel.font = '25px sans-serif';
    playerLabel.textAlign = 'center';
    playerLabel.width = 1000;
    playerLabel.x = (windowWidth - 1000) / 2;
    playerLabel.y = 140 + 50 * index;
    playerLabel.on('touchstart', function() {
      playerSelectLabels[selectedPlayer].color = '#ffffff';
      this.color = gameOrange;
      selectedPlayer = index;
    });
    playerSelectLabels.push(playerLabel);
    scene.addChild(playerLabel);
  });

  var okLabel = new Label('OK!');
  okLabel.textAlign = 'center';
  okLabel.color = '#ffffff';
  okLabel.font = '40px sans-serif';
  okLabel.width = 100;
  okLabel.x = (windowWidth - 100) / 2;
  okLabel.y = 160 + 50 * players.length;
  okLabel.on('touchstart', function() {
    // 最初のplayer情報をserverに送る
    game.emit('first_player_select_info_from_client', selectedPlayer);
    this.color = gameOrange;
    $.each(playerSelectLabels, function(index, val) {
      val.clearEventListener("touchstart");
    });
    this.clearEventListener("touchstart");
  });
  scene.addChild(okLabel);

  return scene;
}

// ホストが誰から始めるかを選択するのを待つ画面
createWaitingSelectFirstPlayerScene = function() {
  var scene = new Scene();
  scene.backgroundColor = 'rgba(0, 0, 0, 0.4)';
  var label = new Label('ホストが最初のPlayerを選んでいます');
  label.textAlign = 'center';
  label.color = '#ffffff';
  label.font = '40px sans-serif';
  label.width = 1000;
  label.x = (windowWidth - 1000) / 2;
  label.y = 187;
  scene.addChild(label);

  return scene;
}

// ターン開始時に表示する画面
createStartTurnScene = function(name) {
  var scene = new Scene();
  scene.backgroundColor = 'rgba(1, 1, 1, 0.4)';

  var bubble_label = new Sprite(1200, 230);
  bubble_label.image = core.assets['/images/bubble_label.png'];
  bubble_label.x = 0;
  bubble_label.y = (windowHeight - 230) / 2;
  bubble_label.opacity = 0;
  bubble_label.tl.tween({
    opacity: 0.4,
    time: 30
  });
  scene.addChild(bubble_label);

  var playerLabel = new Label(`${name}さんのターンです`);
  playerLabel.textAlign = 'left';
  playerLabel.color = gamePink;
  playerLabel.font = '80px sans-serif';
  playerLabel.width = 3000;
  playerLabel.x = 1200;
  playerLabel.y = 310;
  playerLabel.on('enterframe', function() {
    this.x -= 30;
  });
  scene.addChild(playerLabel);

  return scene;
}

// 降参するか確認する画面
createSurrenderConfirmScene = function() {
  var scene = new Scene();
  scene.backgroundColor = 'rgba(1, 1, 1, 0.4)';

  var confirmLabel = new Label("降参しますか？");
  confirmLabel.textAlign = 'center';
  confirmLabel.color = '#ffffff';
  confirmLabel.font = '60px sans-serif';
  confirmLabel.width = 500;
  confirmLabel.x = (windowWidth - 500) / 2;
  confirmLabel.y = 133;
  scene.addChild(confirmLabel);

  var yesLabel = new Label("YES");
  yesLabel.textAlign = 'center';
  yesLabel.color = '#ffffff';
  yesLabel.font = '60px sans-serif';
  yesLabel.width = 200;
  yesLabel.x = 633;
  yesLabel.y = 358;
  yesLabel.addEventListener('touchstart', function(e) {
    core.popScene();
    isTurnEndButtonEnable = false;
    isSurrenderButtonEnable = false;
    turnEndButton.opacity = 0.2;
    surrenderButton.opacity = 0.2;
    // serverに降参を通知する
    game.emit('surrender_request_from_client');
  });
  scene.addChild(yesLabel);

  var noLabel = new Label("NO");
  noLabel.textAlign = 'center';
  noLabel.color = '#ffffff';
  noLabel.font = '60px sans-serif';
  noLabel.width = 200;
  noLabel.x = 342;
  noLabel.y = 358;
  noLabel.addEventListener('touchstart', function(e) {
    core.popScene();
  });
  scene.addChild(noLabel);

  return scene;
}

// Result画面(降参したとき)
createResultScene = function() {
  var scene = new Scene();
  scene.backgroundColor = 'rgba(1, 1, 1, 0.4)';

  var label = new Label("Clear Failed...");
  label.textAlign = 'center';
  label.color = '#ffffff';
  label.font = '60px sans-serif';
  label.width = 1000;
  label.x = (windowWidth - 1000) / 2;
  label.y = windowHeight / 2 - 200;
  scene.addChild(label);

  var subLabel = new Label("降参が選ばれました");
  subLabel.textAlign = 'center';
  subLabel.color = '#ffffff';
  subLabel.font = '30px sans-serif';
  subLabel.width = 1000;
  subLabel.x = (windowWidth - 1000) / 2;
  subLabel.y = windowHeight / 2 - 40;
  scene.addChild(subLabel);

  var subLabel2 = new Label("ウィンドウを閉じて終了してください");
  subLabel2.textAlign = 'center';
  subLabel2.color = '#ffffff';
  subLabel2.font = '30px sans-serif';
  subLabel2.width = 1000;
  subLabel2.x = (windowWidth - 1000) / 2;
  subLabel2.y = windowHeight / 2 + 60;
  scene.addChild(subLabel2);

  return scene;
}

// ゲームクリア画面
createGameClearScene = function() {
  var scene = new Scene();
  scene.backgroundColor = 'rgba(1, 1, 1, 0.4)';

  var clearEffect = new Sprite(1200, 700);
  clearEffect.image = core.assets['/images/clear_effect.png'];
  clearEffect.opacity = 0.4;
  scene.addChild(clearEffect);

  var label = new Label("Congratulations!!!");
  label.textAlign = 'center';
  label.color = '#ffffff';
  label.font = '60px sans-serif';
  label.width = 1000;
  label.x = (windowWidth - 1000) / 2;
  label.y = windowHeight / 2 - 200;
  scene.addChild(label);

  var subLabel = new Label("ゲームをクリアしました");
  subLabel.textAlign = 'center';
  subLabel.color = '#ffffff';
  subLabel.font = '30px sans-serif';
  subLabel.width = 1000;
  subLabel.x = (windowWidth - 1000) / 2;
  subLabel.y = windowHeight / 2 - 40;
  scene.addChild(subLabel);

  var subLabel2 = new Label("ウィンドウを閉じて終了してください");
  subLabel2.textAlign = 'center';
  subLabel2.color = '#ffffff';
  subLabel2.font = '30px sans-serif';
  subLabel2.width = 1000;
  subLabel2.x = (windowWidth - 1000) / 2;
  subLabel2.y = windowHeight / 2 + 60;
  scene.addChild(subLabel2);

  return scene;
}

$(window).on('load', function() {
  core = new Core(windowWidth, windowHeight);
  core.scale = 1;
  core.preload(images);
  moveStageToCenter(core);
  core.rootScene.backgroundColor = '#000000';
  core.loadingScene.addEventListener('progress', function(e) {
    if(e.loaded == e.total) {
      // ロードが完了してからemitする
      game.emit('load_completed_info_from_client', {
        roomId: roomId,
        myName: myName
      });
    }
  });
  core.start();
});

$(function() {
  roomId = $("meta[name=roomId]").attr('content');
  myName = $("meta[name=myName]").attr('content');
  myIndex = $("meta[name=myIndex]").attr('content');
  isHost = ($("meta[name=isHost]").attr('content') == "true") ? true : false;
  game = io.connect('https://the-game-online.herokuapp.com/game');
  //game = io.connect('http://localhost:5000/game'); // local test用

  game.on('disconnect', function() {
    core.pushScene(createCommunicationErrorScene());
  });

  game.on('wating_response_from_server', function(data) {
    core.pushScene(createWaitingSetupInfoScene());
  });

  game.on('setup_start_info_from_server', function(data) {
    game.emit('setup_info_request_from_client', myIndex);
  });

  game.on('setup_info_response_from_server', function(data) {
    core.popScene();
    setupCards();
    $.each(data.playerNames, function(index, val) {
      players.push(val);
    });
    mainScene = createMainScene(data.newMyHand);
    core.pushScene(mainScene);
    if(isHost) {
      core.pushScene(createSelectFirstPlayerScene());
    } else {
      core.pushScene(createWaitingSelectFirstPlayerScene());
    }
  });

  game.on('disconnect_player_info_from_server', function(data) {
    core.pushScene(createDisconnectNotifyScene(data));
    setTimeout(function(){
      window.location.href = "/index";
    }, 5000);
  });

  game.on('surrender_info_from_server', function(data) {
    core.pushScene(createResultScene());
  });

  game.on('first_player_info_from_server', function(data) {
    core.popScene();
    core.pushScene(createStartTurnScene(players[data]));
    changePlayerLabels(data, data);
    // 自分のターンのとき
    if(data == myIndex) {
      isMyTurn = true;
      isSurrenderButtonEnable = true;
      surrenderButton.opacity = 1;
    }
    setTimeout(function() {
      core.popScene();
    }, 3000);
  });

  game.on('play_card_info_from_server', function(data) {
    changeCardMiniDisplay(data.who, -1);
    if(isMyTurn) {
      if(firstPlayCard) {
        // 2枚以上出せばターンを終了できる
        turnEndButton.opacity = 1;
        isTurnEndButtonEnable = true;
      } else {
        firstPlayCard = true;
      } 
    } else {
      // 自分のターンの場合は更新処理をすでに終えているので不要
      changeActionFormAndFieldNumDisplay(data.where, data.what);
    }
  });

  game.on('turn_end_info_from_server', function(data) {
    if(isMyTurn) {
      changeMyHandsDisplay(data.newMyHands);
      isMyTurn = false;
      firstPlayCard = false;
    }
    changeDeckDisplay(data.deckNum);
    changeCardMiniDisplay(data.who, data.drawNum);
    changePlayerLabels(data.who, data.nextPlayerIndex);
    // actionForm欄を空白に戻す
    actionFieldLabel.text = '';
    actionNumberLabel.text = '';

    core.pushScene(createStartTurnScene(players[data.nextPlayerIndex]));
    if(data.nextPlayerIndex == myIndex) {
      // 自分のターンのとき
      isMyTurn = true;
      isSurrenderButtonEnable = true;
      surrenderButton.opacity = 1;
    }
    setTimeout(function() {
      core.popScene();
    }, 3000);
  });

  game.on('game_clear_info_from_server', function(data) {
    core.pushScene(createGameClearScene());
  });

  game.on('put_pafe_info_from_server', function(data) {
    switch(data.where) {
      case INDEX_FIELD_A:
        fieldPafeA.opacity = 0.4;
        fieldPafeLabelA.text = players[data.who];
        fieldPafeLabelA.opacity = 0.4;
        isFieldPafeActive[INDEX_FIELD_A] = true;
        break;
      case INDEX_FIELD_B:
        fieldPafeB.opacity = 0.4;
        fieldPafeLabelB.text = players[data.who];
        fieldPafeLabelB.opacity = 0.4;
        isFieldPafeActive[INDEX_FIELD_B] = true;
        break;
      case INDEX_FIELD_C:
        fieldPafeC.opacity = 0.4;
        fieldPafeLabelC.text = players[data.who];
        fieldPafeLabelC.opacity = 0.4;
        isFieldPafeActive[INDEX_FIELD_C] = true;
        break;
      case INDEX_FIELD_D:
        fieldPafeD.opacity = 0.4;
        fieldPafeLabelD.text = players[data.who];
        fieldPafeLabelD.opacity = 0.4;
        isFieldPafeActive[INDEX_FIELD_D] = true;
        break;
    }
  });

  game.on('delete_pafe_info_from_server', function(data) {
    switch(data) {
      case INDEX_FIELD_A:
        fieldPafeA.opacity = 0;
        fieldPafeLabelA.text = '';
        fieldPafeLabelA.opacity = 0;
        isFieldPafeActive[INDEX_FIELD_A] = false;
        break;
      case INDEX_FIELD_B:
        fieldPafeB.opacity = 0;
        fieldPafeLabelB.text = '';
        fieldPafeLabelB.opacity = 0;
        isFieldPafeActive[INDEX_FIELD_B] = false;
        break;
      case INDEX_FIELD_C:
        fieldPafeC.opacity = 0;
        fieldPafeLabelC.text = '';
        fieldPafeLabelC.opacity = 0;
        isFieldPafeActive[INDEX_FIELD_C] = false;
        break;
      case INDEX_FIELD_D:
        fieldPafeD.opacity = 0;
        fieldPafeLabelD.text = '';
        fieldPafeLabelD.opacity = 0;
        isFieldPafeActive[INDEX_FIELD_D] = false;
        break;
    }
  });
});