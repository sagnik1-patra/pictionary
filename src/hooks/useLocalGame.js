import { useState, useRef, useCallback } from 'react';
import { POP_CULTURE_WORDS } from '../constants/words';

const ROUND_TIME = 60;

const createInitialRoom = (players) => ({
  status: 'waiting', // waiting | drawing | result
  players,
  scores: players.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {}),
  currentDrawerIndex: 0,
  word: '',
  strokes: [],
  messages: [],
  roundStartTime: null,
});

export const useLocalGame = () => {
  const [players, setPlayers] = useState([]); // [{id, name}]
  const [room, setRoom] = useState(null);
  const [timerValue, setTimerValue] = useState(ROUND_TIME);
  const timerRef = useRef(null);

  const addPlayer = (name) => {
    const id = 'player-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    const newPlayer = { id, name };
    setPlayers(prev => [...prev, newPlayer]);
    return newPlayer;
  };

  const startGame = () => {
    if (players.length === 0) return;
    const word = POP_CULTURE_WORDS[Math.floor(Math.random() * POP_CULTURE_WORDS.length)];
    const newRoom = createInitialRoom(players);
    newRoom.status = 'drawing';
    newRoom.currentDrawerIndex = 0;
    newRoom.word = word;
    newRoom.roundStartTime = Date.now();
    setRoom(newRoom);
    startTimer(newRoom);
  };

  const startTimer = (currentRoom) => {
    clearInterval(timerRef.current);
    setTimerValue(ROUND_TIME);
    let timeLeft = ROUND_TIME;
    timerRef.current = setInterval(() => {
      timeLeft -= 1;
      setTimerValue(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(timerRef.current);
        // Time's up — move to result
        setRoom(prev => prev ? { ...prev, status: 'result', timeUp: true } : prev);
      }
    }, 1000);
  };

  const nextRound = useCallback(() => {
    clearInterval(timerRef.current);
    setRoom(prev => {
      if (!prev) return prev;
      const nextIndex = (prev.currentDrawerIndex + 1) % prev.players.length;
      const word = POP_CULTURE_WORDS[Math.floor(Math.random() * POP_CULTURE_WORDS.length)];
      const updated = {
        ...prev,
        status: 'drawing',
        currentDrawerIndex: nextIndex,
        word,
        strokes: [],
        messages: [],
        roundStartTime: Date.now(),
        timeUp: false,
      };
      // Start timer after state set
      setTimeout(() => startTimer(updated), 0);
      return updated;
    });
    setTimerValue(ROUND_TIME);
  }, []);

  const sendStroke = useCallback((strokeData, type) => {
    setRoom(prev => {
      if (!prev) return prev;
      const newStrokes = [...prev.strokes];
      if (type === 'clear') return { ...prev, strokes: [] };
      if (type === 'start') return { ...prev, strokes: [...newStrokes, { points: [strokeData] }] };
      if (type === 'point' && newStrokes.length > 0) {
        const lastStroke = { ...newStrokes[newStrokes.length - 1], points: [...newStrokes[newStrokes.length - 1].points, strokeData] };
        newStrokes[newStrokes.length - 1] = lastStroke;
        return { ...prev, strokes: newStrokes };
      }
      return prev;
    });
  }, []);

  const sendMessage = useCallback((text, senderId, senderName) => {
    setRoom(prev => {
      if (!prev) return prev;
      const isCorrect =
        prev.status === 'drawing' &&
        prev.players[prev.currentDrawerIndex]?.id !== senderId &&
        text.toLowerCase().trim() === prev.word.toLowerCase().trim();

      const msg = {
        id: Date.now(),
        uid: senderId,
        name: senderName,
        text,
        type: isCorrect ? 'correct' : 'chat',
      };

      const newMessages = [...prev.messages, msg];

      if (isCorrect) {
        clearInterval(timerRef.current);
        const drawer = prev.players[prev.currentDrawerIndex];
        return {
          ...prev,
          status: 'result',
          timeUp: false,
          messages: newMessages,
          scores: {
            ...prev.scores,
            [senderId]: (prev.scores[senderId] || 0) + 10,
            [drawer.id]: (prev.scores[drawer.id] || 0) + 5,
          },
        };
      }

      return { ...prev, messages: newMessages };
    });
  }, []);

  const currentDrawer = room ? room.players[room.currentDrawerIndex] : null;

  return {
    players,
    room,
    timerValue,
    currentDrawer,
    addPlayer,
    startGame,
    nextRound,
    sendStroke,
    sendMessage,
  };
};
