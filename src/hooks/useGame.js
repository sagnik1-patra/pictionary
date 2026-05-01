import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  arrayUnion, 
  setDoc, 
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { POP_CULTURE_WORDS } from '../constants/words';

export const useGame = (roomId, user) => {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) return;

    // Timeout to fallback to mock mode if Firebase is not configured
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn("Firebase connection timed out. Switching to Mock Mode.");
        setRoom(prev => {
          if (prev) return prev;
          return {
            status: 'waiting',
            players: [],
            scores: {},
            currentDrawer: null,
            word: '',
            strokes: [],
            messages: [],
            mock: true
          };
        });
        setLoading(false);
      }
    }, 3000);

    let unsubscribe = () => {};
    try {
      const roomRef = doc(db, 'rooms', roomId);
      unsubscribe = onSnapshot(roomRef, (snapshot) => {
        clearTimeout(timeout);
        if (snapshot.exists()) {
          setRoom(snapshot.data());
        } else {
          const initialRoom = {
            status: 'waiting',
            players: [],
            scores: {},
            currentDrawer: null,
            word: '',
            strokes: [],
            messages: [],
            createdAt: serverTimestamp()
          };
          setDoc(roomRef, initialRoom);
          setRoom(initialRoom);
        }
        setLoading(false);
      }, (err) => {
        console.error("Firestore Error:", err);
        // Don't clear timeout, let it fallback
      });
    } catch (e) {
      console.error("Firebase Initialization Error:", e);
    }

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [roomId]);

  const joinRoom = async (nickname, specificUser) => {
    const currentUser = specificUser || user;
    if (room?.mock) {
      setRoom(prev => ({
        ...prev,
        players: [...prev.players, { uid: currentUser.uid, name: nickname }],
        scores: { ...prev.scores, [currentUser.uid]: 0 }
      }));
      return;
    }
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      players: arrayUnion({ uid: currentUser.uid, name: nickname }),
      [`scores.${currentUser.uid}`]: 0
    });
  };

  const startRound = async () => {
    const randomWord = POP_CULTURE_WORDS[Math.floor(Math.random() * POP_CULTURE_WORDS.length)];
    const nextDrawer = room.players[Math.floor(Math.random() * room.players.length)]?.uid || user.uid;

    if (room?.mock) {
      setRoom(prev => ({
        ...prev,
        status: 'drawing',
        currentDrawer: nextDrawer,
        word: randomWord,
        strokes: [],
        startTime: Date.now()
      }));
      return;
    }

    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      status: 'drawing',
      currentDrawer: nextDrawer,
      word: randomWord,
      strokes: [],
      startTime: Date.now()
    });
  };

  const sendStroke = async (strokeData, type) => {
    if (room?.mock) {
      setRoom(prev => {
        const newStrokes = [...prev.strokes];
        if (type === 'clear') return { ...prev, strokes: [] };
        if (type === true) return { ...prev, strokes: [...prev.strokes, strokeData] };
        if (newStrokes.length > 0) {
          newStrokes[newStrokes.length - 1].points.push(strokeData);
        }
        return { ...prev, strokes: newStrokes };
      });
      return;
    }

    const roomRef = doc(db, 'rooms', roomId);
    if (type === 'clear') {
      await updateDoc(roomRef, { strokes: [] });
    } else if (type === 'end') {
      // Stroke finished
    } else if (type === true) {
      // Start new stroke
      await updateDoc(roomRef, {
        strokes: arrayUnion(strokeData)
      });
    } else {
      const newStrokes = [...room.strokes];
      if (newStrokes.length > 0) {
        newStrokes[newStrokes.length - 1].points.push(strokeData);
        await updateDoc(roomRef, { strokes: newStrokes });
      }
    }
  };

  const sendMessage = async (text) => {
    const isCorrect = text.toLowerCase().trim() === room.word?.toLowerCase().trim();
    const message = {
      uid: user.uid,
      name: user.name || 'Anonymous',
      text: text,
      type: isCorrect ? 'correct' : 'chat',
      timestamp: Date.now()
    };

    if (room?.mock) {
      setRoom(prev => {
        const updates = {
          ...prev,
          messages: [...prev.messages, message]
        };
        if (isCorrect && prev.status === 'drawing' && user.uid !== prev.currentDrawer) {
          updates.scores = {
            ...prev.scores,
            [user.uid]: (prev.scores[user.uid] || 0) + 10,
            [prev.currentDrawer]: (prev.scores[prev.currentDrawer] || 0) + 5
          };
          updates.status = 'result';
        }
        return updates;
      });
      return;
    }

    const roomRef = doc(db, 'rooms', roomId);
    const updates = {
      messages: arrayUnion(message)
    };

    if (isCorrect && room.status === 'drawing' && user.uid !== room.currentDrawer) {
      updates[`scores.${user.uid}`] = (room.scores[user.uid] || 0) + 10;
      updates[`scores.${room.currentDrawer}`] = (room.scores[room.currentDrawer] || 0) + 5;
      updates.status = 'result';
    }

    await updateDoc(roomRef, updates);
  };

  return { room, loading, joinRoom, startRound, sendStroke, sendMessage };
};
