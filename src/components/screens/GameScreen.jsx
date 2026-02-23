import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ButtonLink from '../ui/ButtonLink';
import profilesData from '../../data/profiles.json';

function GameScreen() {
  const { state } = useLocation();
  const initialLife = state?.lifeTotal || 40;
  const participants = state?.participants || [];

  const [round, setRound] = useState(1);
  const [turnIndex, setTurnIndex] = useState(0);
  const [gameState, setGameState] = useState('active');
  const [currentAction, setCurrentAction] = useState(null);
  const [logs, setLogs] = useState([{
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    text: "Match Started."
  }]);

  const [players, setPlayers] = useState(
    participants.map(p => ({ ...p, currentLife: initialLife }))
  );

  const currentPlayer = players[turnIndex];

  const addLog = (text) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [{ time, text }, ...prev]);
  };

  const updateLife = (id, amount) => {
    setPlayers(prev => prev.map(p => {
      if (p.id === id) {
        const newLife = p.currentLife + amount;
        if (newLife <= 0 && p.currentLife > 0) addLog(`💀 ${p.name} has been defeated!`);
        addLog(`${p.name} life: ${p.currentLife} -> ${newLife}`);
        return { ...p, currentLife: newLife };
      }
      return p;
    }));
  };

  const resolveAction = () => {
    if (currentAction?.impact) {
      const { target, value } = currentAction.impact;
      setPlayers(prev => prev.map(p => {
        let newLife = p.currentLife;
        if (target === "all" && p.id !== currentPlayer.id) newLife += value;
        if (target === "user" && p.type === "user") newLife += value;

        if (newLife <= 0 && p.currentLife > 0) addLog(`💀 ${p.name} has been defeated!`);
        return { ...p, currentLife: newLife };
      }));
      addLog(`💥 ${currentAction.name} resolved.`);
    } else {
      addLog(`✅ ${currentAction.name} resolved.`);
    }
    nextTurn();
  };

  const nextTurn = () => {
    setGameState('active');
    setCurrentAction(null);

    let nextIdx = turnIndex;
    let newRound = round;
    let foundActivePlayer = false;

    // Search for next player with life > 0
    for (let i = 0; i < players.length; i++) {
      nextIdx = (nextIdx + 1) % players.length;
      if (nextIdx === 0) newRound++;

      if (players[nextIdx].currentLife > 0) {
        foundActivePlayer = true;
        break;
      }
    }

    if (foundActivePlayer) {
      if (newRound !== round) {
        setRound(newRound);
        addLog(`--- Round ${newRound} ---`);
      }
      setTurnIndex(nextIdx);
    } else {
      addLog("🏆 Game Over: No active players remaining.");
    }
  };

  const checkForResponses = () => {
    const opponents = players.filter(p => p.type === 'opponent' && p.currentLife > 0);
    let triggered = null;

    for (const opp of opponents) {
      const profile = profilesData.find(pr => pr.id === opp.profileId);
      const validInteractions = profile.actions.filter(a => a.timing === "any_turn" && round >= (a.min_round || 1));

      if (validInteractions.length === 0) continue;
      const action = validInteractions[Math.floor(Math.random() * validInteractions.length)];
      const weight = action.base_weight + (opp.currentLife < 15 ? (action.mod_low_health || 0) : 0);

      if (Math.floor(Math.random() * 100) < weight) {
        triggered = { action, responder: opp };
        break;
      }
    }

    if (triggered) {
      setCurrentAction(triggered.action);
      setGameState('pending-reaction');
      addLog(`‼️ ${triggered.responder.name} responds: ${triggered.action.name}`);
    } else {
      addLog("✅ No responses found.");
    }
  };

  useEffect(() => {
    if (currentPlayer?.type === 'opponent' && gameState === 'active' && currentPlayer.currentLife > 0) {
      const profile = profilesData.find(p => p.id === currentPlayer.profileId);
      const validActions = profile.actions.filter(a => a.timing === "own_turn" && round >= (a.min_round || 1));

      if (validActions.length > 0) {
        const action = validActions[Math.floor(Math.random() * validActions.length)];
        const weight = action.base_weight + (round > 5 ? (action.mod_late_game || 0) : 0);

        if (Math.floor(Math.random() * 100) < weight) {
          setCurrentAction(action);
          setGameState('pending-reaction');
          addLog(`⚠️ ${currentPlayer.name} plays: ${action.name}`);
          return;
        }
      }
      addLog(`💤 ${currentPlayer.name} passes.`);
    }
  }, [turnIndex, gameState, currentPlayer, round]);

  return (
    <div className="flex h-screen bg-zinc-950 text-white font-beleren overflow-hidden">
      <aside className="w-80 bg-stone-900 border-r border-stone-800 flex flex-col shadow-2xl">
        <div className="p-6 border-b border-stone-800">
          <span className="text-blue-500 text-xs uppercase tracking-widest">Round {round}</span>
          <h2 className="text-xl italic uppercase truncate">{currentPlayer?.name}</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 text-[11px] font-mono text-zinc-400">
          {logs.map((l, i) => <div key={i}><span className="text-zinc-600">[{l.time}]</span> {l.text}</div>)}
        </div>
        <div className="p-4 bg-stone-950/50 border-t border-stone-800 space-y-2">
          {/* <button onClick={() => setLogs(prev => prev.slice(1))} className="w-full py-2 bg-stone-800 text-zinc-300 rounded text-[10px] uppercase">Undo Log</button> */}
          <ButtonLink to="/" className="block w-full py-2 bg-red-900/20 text-red-400 rounded text-[10px] text-center uppercase border border-red-900/50">Quit Match</ButtonLink>
        </div>
      </aside>

      <main className="flex-1 p-10 flex flex-wrap gap-6 justify-center overflow-y-auto pb-40">
        {players.map((player) => {
          const isDefeated = player.currentLife <= 0;
          const isCurrent = currentPlayer?.id === player.id;
          return (
            <div key={player.id} className={`w-64 h-80 rounded-2xl border-2 flex flex-col items-center justify-between p-6 transition-all duration-500 
              ${isDefeated ? 'grayscale opacity-30 border-red-900 bg-black' : isCurrent ? 'border-blue-500 bg-stone-800 shadow-2xl scale-105' : 'border-stone-800 bg-stone-900/50 opacity-60'}`}>
              <div className="text-center">
                <span className="text-[10px] text-zinc-500 uppercase">{isDefeated ? 'Eliminated' : player.type}</span>
                <h3 className="uppercase tracking-tighter truncate w-48">{player.name}</h3>
              </div>
              {isDefeated ? <div className="text-4xl opacity-50">💀</div> : (
                <div className="flex items-center gap-4">
                  <button onClick={() => updateLife(player.id, -1)} className="text-2xl text-zinc-500 hover:text-white">-</button>
                  <span className="text-6xl font-bold tabular-nums">{player.currentLife}</span>
                  <button onClick={() => updateLife(player.id, 1)} className="text-2xl text-zinc-500 hover:text-white">+</button>
                </div>
              )}
              {!isDefeated && (
                <div className="flex gap-2 w-full">
                  <button onClick={() => updateLife(player.id, -5)} className="flex-1 bg-stone-950 border border-stone-700 rounded py-1 text-xs">-5</button>
                  <button onClick={() => updateLife(player.id, 5)} className="flex-1 bg-stone-950 border border-stone-700 rounded py-1 text-xs">+5</button>
                </div>
              )}
            </div>
          );
        })}
      </main>

      <footer className="fixed bottom-0 left-80 right-0 h-32 bg-stone-900/95 border-t border-stone-700 px-10 flex items-center justify-between shadow-2xl">
        <div>
          <span className="text-xs font-bold text-zinc-500 uppercase">{currentPlayer?.type === 'user' ? "Your Turn" : "Opponent Turn"}</span>
          <p className="text-xl italic">{gameState === 'pending-reaction' ? `RESOLVE: ${currentAction?.name}?` : 'Ready?'}</p>
        </div>
        <div className="flex gap-4">
          {gameState === 'pending-reaction' ? (
            <>
              <button onClick={() => { addLog(`Countered ${currentAction.name}`); nextTurn(); }} className="px-8 py-4 bg-red-900/40 border border-red-500 rounded font-bold uppercase hover:bg-red-900/60 transition-colors">Counter</button>
              <button onClick={resolveAction} className="px-8 py-4 bg-green-900/40 border border-green-500 rounded font-bold uppercase hover:bg-green-900/60 transition-colors">Resolve</button>
            </>
          ) : (
            <>
              {currentPlayer?.type === 'user' && <button onClick={checkForResponses} className="px-8 py-4 bg-blue-600/20 border border-blue-500 text-blue-400 font-bold uppercase">Check Responses</button>}
              <button onClick={nextTurn} className="px-12 py-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all">Next Turn</button>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}

export default GameScreen;