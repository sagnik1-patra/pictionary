import React, { useState, useEffect, useRef } from 'react';
import Canvas from './components/Canvas';
import { useLocalGame } from './hooks/useLocalGame';
import confetti from 'canvas-confetti';

// ─── ICONS (inline SVGs to avoid import issues) ────────────────────────────
const IconPalette = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/>
    <circle cx="6.5" cy="12.5" r=".5"/>
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
  </svg>
);
const IconTrophy = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="13"/>
    <path d="M7 4H4a2 2 0 0 0-2 2v3c0 4 3.5 7 10 7s10-3 10-7V6a2 2 0 0 0-2-2h-3"/>
    <path d="M7 4h10"/>
  </svg>
);
const IconChat = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconSend = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const IconPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconPlay = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);

// ─── COLOUR PALETTE FOR PLAYER AVATARS ─────────────────────────────────────
const AVATAR_COLORS = [
  'linear-gradient(135deg,#6366f1,#818cf8)',
  'linear-gradient(135deg,#f43f5e,#fb7185)',
  'linear-gradient(135deg,#10b981,#34d399)',
  'linear-gradient(135deg,#f59e0b,#fbbf24)',
  'linear-gradient(135deg,#8b5cf6,#a78bfa)',
  'linear-gradient(135deg,#0ea5e9,#38bdf8)',
];

// ─── WORD HINT (obscure letters) ────────────────────────────────────────────
const maskWord = (word) =>
  word.split('').map(c => (c === ' ' ? '  ' : '_')).join(' ');

// ─── SETUP SCREEN ──────────────────────────────────────────────────────────
const SetupScreen = ({ onStart }) => {
  const [nameInput, setNameInput] = useState('');
  const [playerNames, setPlayerNames] = useState([]);

  const addPlayer = () => {
    const trimmed = nameInput.trim();
    if (!trimmed || playerNames.includes(trimmed)) return;
    setPlayerNames(prev => [...prev, trimmed]);
    setNameInput('');
  };

  const handleKey = (e) => { if (e.key === 'Enter') addPlayer(); };

  return (
    <div className="setup-screen fade-up">
      <div className="glass-card setup-card">
        <div className="setup-logo"><IconPalette /></div>
        <h1 className="setup-title">Pictionary</h1>
        <p className="setup-sub">Draw pop culture icons. Guess to earn points!</p>

        <p className="section-label">Add Players</p>
        <div className="add-player-row">
          <input
            type="text"
            placeholder="Enter player name…"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onKeyDown={handleKey}
            autoFocus
            maxLength={20}
          />
          <button className="primary" onClick={addPlayer} style={{ padding: '11px 14px' }}><IconPlus /></button>
        </div>

        {playerNames.length > 0 && (
          <div className="player-list">
            {playerNames.map((name, i) => (
              <div key={name} className="player-chip">
                <div className="player-avatar" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                  {name[0].toUpperCase()}
                </div>
                <span style={{ fontWeight: 600 }}>{name}</span>
                <button
                  onClick={() => setPlayerNames(prev => prev.filter(n => n !== name))}
                  style={{ marginLeft: 'auto', background: 'transparent', color: 'var(--text-dim)', padding: '4px 8px', fontSize: '1rem' }}
                >✕</button>
              </div>
            ))}
          </div>
        )}

        {playerNames.length === 0 && (
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>
            Add at least 1 player to begin.<br/>
            <span style={{ fontSize: '0.78rem' }}>(Solo play: you draw & verify your own guess!)</span>
          </p>
        )}

        <button
          className="primary"
          style={{ width: '100%', marginTop: '1.5rem', padding: '14px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          disabled={playerNames.length === 0}
          onClick={() => onStart(playerNames)}
        >
          <IconPlay /> Start Game
        </button>
      </div>
    </div>
  );
};

// ─── MAIN GAME SCREEN ───────────────────────────────────────────────────────
const GameScreen = ({ room, players, currentDrawer, timerValue, currentPlayer, sendStroke, sendMessage, nextRound }) => {
  const [msgInput, setMsgInput] = useState('');
  const messagesEndRef = useRef(null);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room.messages]);

  // Confetti on correct guess
  useEffect(() => {
    if (room.status === 'result' && !room.timeUp) {
      confetti({ particleCount: 160, spread: 80, origin: { y: 0.55 }, colors: ['#6366f1','#f43f5e','#10b981','#f59e0b'] });
    }
  }, [room.status]);

  const isDrawer = currentPlayer?.id === currentDrawer?.id;

  const handleSend = (e) => {
    e.preventDefault();
    const text = msgInput.trim();
    if (!text) return;
    sendMessage(text, currentPlayer.id, currentPlayer.name);
    setMsgInput('');
  };

  const sortedPlayers = [...players].sort((a, b) => (room.scores[b.id] || 0) - (room.scores[a.id] || 0));

  if (room.status === 'result') {
    return (
      <div className="game-layout">
        {/* Scoreboard */}
        <aside className="glass-card scoreboard">
          <div className="scoreboard-header">
            <span style={{ color: 'var(--warning)' }}><IconTrophy /></span>
            <h2>Leaderboard</h2>
          </div>
          {sortedPlayers.map((p, i) => (
            <div key={p.id} className={`player-row ${p.id === currentDrawer?.id ? 'active' : ''}`}>
              <div className="player-row-info">
                <div className="player-avatar" style={{ width: 32, height: 32, borderRadius: '50%', background: AVATAR_COLORS[players.indexOf(p) % AVATAR_COLORS.length], display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.8rem' }}>
                  {p.name[0].toUpperCase()}
                </div>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name} {p.id === currentPlayer.id && <span style={{ color: 'var(--text-dim)', fontSize:'0.75rem' }}>(you)</span>}</span>
              </div>
              <span className="player-score">+{room.scores[p.id] || 0}</span>
            </div>
          ))}
        </aside>

        {/* Result Card */}
        <main className="glass-card scale-in" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div className="result-screen">
            <div className="result-emoji">{room.timeUp ? '⏰' : '🎉'}</div>
            <div className="result-title">{room.timeUp ? "Time's Up!" : 'Correct!'}</div>
            <p className="result-word">The word was: <span>{room.word}</span></p>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
              Next up: <strong style={{ color:'var(--text-main)' }}>{players[(room.currentDrawerIndex + 1) % players.length]?.name}</strong> draws
            </p>
            <button className="primary" style={{ marginTop: '0.5rem', fontSize: '1rem', padding: '13px 32px' }} onClick={nextRound}>
              Next Round →
            </button>
          </div>
        </main>

        {/* Chat History */}
        <aside className="glass-card chat-panel">
          <div className="chat-header"><IconChat /><h2>Chat</h2></div>
          <div className="messages">
            {room.messages.map((m) => (
              <div key={m.id} className={`message ${m.type}`}>
                <span className="message-author">{m.name}:</span>
                <span>{m.type === 'correct' ? '🎯 guessed the word!' : m.text}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </aside>
      </div>
    );
  }

  // Drawing phase
  return (
    <div className="game-layout">
      {/* Scoreboard */}
      <aside className="glass-card scoreboard">
        <div className="scoreboard-header">
          <span style={{ color: 'var(--warning)' }}><IconTrophy /></span>
          <h2>Leaderboard</h2>
        </div>
        {sortedPlayers.map((p) => (
          <div key={p.id} className={`player-row ${p.id === currentDrawer?.id ? 'active' : ''}`}>
            <div className="player-row-info">
              <div className="player-avatar" style={{ width: 32, height: 32, borderRadius: '50%', background: AVATAR_COLORS[players.indexOf(p) % AVATAR_COLORS.length], display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.8rem' }}>
                {p.name[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', lineHeight: 1.2 }}>{p.name} {p.id === currentPlayer.id && <span style={{ color: 'var(--text-dim)', fontSize:'0.72rem' }}>(you)</span>}</div>
                {p.id === currentDrawer?.id && <span className="drawing-badge">✏️ Drawing</span>}
              </div>
            </div>
            <span className="player-score">{room.scores[p.id] || 0}</span>
          </div>
        ))}
      </aside>

      {/* Canvas Area */}
      <main className="canvas-area">
        <div className="glass-card word-bar">
          <div>
            <div className="word-label">{isDrawer ? '🎨 Your word — draw it!' : `👀 ${currentDrawer?.name} is drawing…`}</div>
            <div className="word-value">
              {isDrawer ? room.word : maskWord(room.word)}
            </div>
          </div>
          <div className={`timer ${timerValue <= 10 ? 'urgent' : ''}`}>
            {timerValue}s
          </div>
        </div>
        <div className="glass-card canvas-wrapper">
          <Canvas isDrawer={isDrawer} onDraw={sendStroke} strokes={room.strokes} />
        </div>
      </main>

      {/* Chat Panel */}
      <aside className="glass-card chat-panel">
        <div className="chat-header"><IconChat /><h2>Chat & Guesses</h2></div>
        <div className="messages">
          {room.messages.length === 0 && (
            <p className="message system">Game started! {isDrawer ? 'Draw the word above.' : 'Type your guesses below.'}</p>
          )}
          {room.messages.map((m) => (
            <div key={m.id} className={`message ${m.type}`}>
              <span className="message-author">{m.name}:</span>
              <span>{m.type === 'correct' ? '🎯 guessed the word!' : m.text}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form className="chat-input-row" onSubmit={handleSend}>
          <input
            type="text"
            placeholder={isDrawer ? "You can't guess — draw!" : 'Type your guess…'}
            disabled={isDrawer}
            value={msgInput}
            onChange={e => setMsgInput(e.target.value)}
            autoComplete="off"
          />
          <button type="submit" className="send-btn" disabled={isDrawer}><IconSend /></button>
        </form>
      </aside>
    </div>
  );
};

// ─── PLAYER SELECT (shown at round start if >1 player) ──────────────────────
const PlayerSelectScreen = ({ drawer, onReady }) => (
  <div className="setup-screen fade-up">
    <div className="glass-card setup-card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎨</div>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
        {drawer.name}'s Turn!
      </h2>
      <p style={{ color: 'var(--text-dim)', marginBottom: '2rem' }}>
        Pass the device to <strong style={{ color: 'white' }}>{drawer.name}</strong>.<br />
        Others, look away while they see their word!
      </p>
      <button className="primary" style={{ width: '100%', padding: '14px', fontSize: '1rem' }} onClick={onReady}>
        I'm ready — show my word ✓
      </button>
    </div>
  </div>
);

// ─── APP ROOT ───────────────────────────────────────────────────────────────
const App = () => {
  const [phase, setPhase] = useState('setup');      // setup | handoff | game
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [handoffNeeded, setHandoffNeeded] = useState(false);

  const { players, room, timerValue, currentDrawer, addPlayer, startGame, nextRound, sendStroke, sendMessage } = useLocalGame();

  const handleSetupStart = (names) => {
    names.forEach(n => addPlayer(n));
    // Trigger game start after players are added (next tick)
    setTimeout(() => setPhase('handoff'), 0);
  };

  // When phase becomes 'handoff', start the actual game
  useEffect(() => {
    if (phase === 'handoff' && players.length > 0) {
      if (players.length === 1) {
        // Solo: skip handoff
        startGame();
        setCurrentPlayerIndex(0);
        setPhase('game');
      }
      // else: stay on handoff screen
    }
  }, [phase, players.length]);

  const handleHandoffReady = () => {
    startGame();
    setCurrentPlayerIndex(0);
    setPhase('game');
  };

  const handleNextRound = () => {
    if (players.length > 1) {
      const nextIdx = (room.currentDrawerIndex + 1) % players.length;
      setCurrentPlayerIndex(nextIdx);
      setHandoffNeeded(true);
    } else {
      nextRound();
    }
  };

  // After a multi-player handoff, proceed to next round
  useEffect(() => {
    if (handoffNeeded) setHandoffNeeded(false);
  }, [handoffNeeded]);

  if (phase === 'setup') return <SetupScreen onStart={handleSetupStart} />;

  if (phase === 'handoff' && players.length > 1) {
    return <PlayerSelectScreen drawer={players[0]} onReady={handleHandoffReady} />;
  }

  if (!room) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontSize:'1.2rem', color:'var(--text-dim)' }}>
        Loading…
      </div>
    );
  }

  // Handoff between rounds for multiplayer
  if (handoffNeeded && players.length > 1) {
    const nextDrawerIdx = (room.currentDrawerIndex + 1) % players.length;
    const nextDrawerPlayer = players[nextDrawerIdx];
    return (
      <div className="setup-screen fade-up">
        <div className="glass-card setup-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔄</div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            {nextDrawerPlayer.name}'s Turn!
          </h2>
          <p style={{ color: 'var(--text-dim)', marginBottom: '2rem' }}>
            Pass the device to <strong style={{ color: 'white' }}>{nextDrawerPlayer.name}</strong>.<br />
            Others, look away!
          </p>
          <button className="primary" style={{ width: '100%', padding: '14px', fontSize: '1rem' }} onClick={() => { setCurrentPlayerIndex(nextDrawerIdx); nextRound(); setHandoffNeeded(false); }}>
            I'm ready — show my word ✓
          </button>
        </div>
      </div>
    );
  }

  const currentPlayer = players[currentPlayerIndex] || players[0];

  return (
    <GameScreen
      room={room}
      players={players}
      currentDrawer={currentDrawer}
      timerValue={timerValue}
      currentPlayer={currentPlayer}
      sendStroke={sendStroke}
      sendMessage={sendMessage}
      nextRound={handleNextRound}
    />
  );
};

export default App;
