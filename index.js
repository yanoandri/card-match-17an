/* eslint-disable no-case-declarations */
const WebSocket = require('ws');

const roomId = "33d998d1-445c";
const playerName = "kodoksombong";
const host = "ws://localhost:3000";
const ws = new WebSocket(host);

let dataJoin = (data) => {
  clientId = data.clientId
  let dataJoin = {
    from: 'player',
    type: 'join',
    room: roomId,
    playerName: playerName,
    clientId: data.clientId
  }
  return dataJoin;
}

let dataPick = (pos) => {
  let dataPick = {
    from: 'player',
    type: 'pick',
    room: roomId,
    clientId: clientId,
    cardPos: pos
  }

  return dataPick;
}

var clientId = null;

/**
 * init custom variables
 */
let cardPos
let cardTrack
let countInfo = -1
const trackLists = []


let getRandomInt = (max) => {
  return Math.floor(Math.random() * Math.floor(max));
}

let getCardPos = () => {
  return cardPos
}

let setCardPos = (val) => {
  cardPos = val
}

let setCardTrack = (val) => {
  cardTrack = val
}

let getCardTrack = () => {
  return cardTrack
}

let pushTrackLists = (card) => {
  card.isMatched = false
  delete card['lastTurn']
  trackLists.push(card)
}

let setMatchedCard = (cardA, cardB) => {
  for (const item of trackLists) {
    if(item.lastOpenedCard.split('-')[0] === cardA.lastOpenedCard.split('-')[0]
      && item.openedCardPos == cardA.openedCardPos
    ){
      item.isMatched = true
    }

    if(item.lastOpenedCard.split('-')[0] === cardB.lastOpenedCard.split('-')[0]
      && item.openedCardPos == cardB.openedCardPos
    ){
      item.isMatched = true
    }
  }
}

let setCountInfo = (val) => {
  countInfo = val
}

let getCountInfo = () => {
  return countInfo
}

let isTrackOpenedBefore = (card) => {
  for (const item of trackLists) {
    if(item.openedCardPos == card.openedCardPos){
      return false
    }
  }
  return true
}

let findCardIfItsMathched = (pos) => {
  for (const item of trackLists){
    if(item.openedCardPos ==  pos
      && item.isMatched){
      return true
    }
  }
  return false
}

let findCardMatchWithMyPick = (pos) => {
 let shape = ''
 let cardPos = -1
 for (const item of trackLists){
   if(item.openedCardPos ==  pos){
    shape = item.lastOpenedCard
   }
 }
 if(shape != ''){
  for(const card of trackLists){
    if(card.lastOpenedCard.split('-')[0] === shape.split('-')[0]
      && card.openedCardPos != pos
      && !card.isMatched){
      return card.openedCardPos
    }
  }
 }
 return cardPos
}

ws.on('open', function open() {
  console.log('connected');
});

ws.on('message', (event) => {
  let data = JSON.parse(event);
  switch (data.type) {
    case 'create':
      ws.send(JSON.stringify(dataJoin(data)));
      break;
    case 'info':
      // everytime a card flipped you will get data about flipped card, EX:
      // { type: 'info', lastOpenedCard: 'seven-a', openedCardPos: 3, lastTurn: 'f6d11cbf-1e88' }
      //push track lists if it's not in the map things list
      if(isTrackOpenedBefore(data))pushTrackLists(data)
      //check if it's info from first pick turn
      let count = getCountInfo()
      setCountInfo(++count)
      if(countInfo == 0){
        setCardTrack(data)
      }else{
        const lastCard = getCardTrack()
        if(lastCard 
            && (lastCard.lastOpenedCard.split('-')[0] === data.lastOpenedCard.split('-')[0])){
          //set is matched
          setMatchedCard(lastCard, data)
        }
        setCardTrack(null)
        setCountInfo(-1)
      }
      console.log(data)
      break;
    case 'turn':
      // if it's your turn to pick a card, you will get this event with data
      // { type: 'turn', turn: 1, lastTurn: 'f6d11cbf-1e88', currentTurn: 'f6d11cbf-1e88' }
      // turn : 0 = first pick
      // turn : 1 = second pick
      // To pick a card you can send the index of the card you want to pick by using dataPick() function and pass the index
      console.log(data)
      let position
      if(data.turn == 0){
        do{
            position = getRandomInt(18)
        }while(findCardIfItsMathched(position))
        setCardPos(position)
      }else{
        let lastPosition = getCardPos()
        let rememberCard = findCardMatchWithMyPick(lastPosition)
        if(rememberCard != -1){
          position = rememberCard
        }else{
          do{
            position = getRandomInt(18)
          }while(findCardIfItsMathched(position) || position == lastPosition)
        }
        setCardPos(-1)
      }
      const pick = dataPick(position)
      console.log(pick)
      ws.send(JSON.stringify(pick));
      break;
  }
});

