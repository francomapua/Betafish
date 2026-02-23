import React, { useState } from 'react';
import ButtonLink from '../ui/ButtonLink';
import profilesData from '../../data/profiles.json';
import betafishSvg from '../../assets/betafish.svg';
import { useNavigate } from 'react-router-dom';

function NewGameScreen() {
  const navigate = useNavigate();
  const [lifeTotal, setLifeTotal] = useState(40);

  // Helper: Get random profile
  const getRandomProfile = () => profilesData[Math.floor(Math.random() * profilesData.length)];

  // Fixed Initial State (Includes Name)
  const [opponents, setOpponents] = useState([
    { type: 'opponent', id: 'opp-init', profileId: profilesData[0].id, name: profilesData[0].name }
  ]);
  const [participants, setParticipants] = useState([
    { type: 'user', name: 'You', id: 'user-0' },
    { type: 'opponent', id: 'opp-init', profileId: profilesData[0].id, name: profilesData[0].name }
  ]);

  const updateOpponentCount = (count) => {
    const newOpponents = Array.from({ length: count }, (_, i) => ({
      type: 'opponent',
      id: `opp-${Date.now()}-${i}`,
      profileId: profilesData[0].id,
      name: profilesData[0].name
    }));
    setOpponents(newOpponents);
    setParticipants([{ type: 'user', name: 'You', id: 'user-0' }, ...newOpponents]);
  };

  const randomizeProfiles = () => {
    const randomized = participants.map(p => {
      if (p.type === 'user') return p;
      const rand = getRandomProfile();
      return { ...p, name: rand.name, profileId: rand.id };
    });
    setParticipants(randomized);
  };

  const shuffleOrder = () => {
    setParticipants([...participants].sort(() => Math.random() - 0.5));
  };

  const handleBegin = () => {
    navigate('/game', { state: { participants, lifeTotal } });
  };

  return (
    <div className="min-h-screen bg-zinc-900 font-beleren p-6 text-white flex flex-col items-center">
      <img src={betafishSvg} className="w-16 h-16 mb-4" alt="logo" />
      <h1 className="text-4xl uppercase tracking-tighter mb-8">Match Setup</h1>

      <div className="w-full max-w-md bg-stone-800 p-6 rounded-xl border border-stone-700 shadow-2xl space-y-8">
        <div>
          <label className="block text-xs text-zinc-400 uppercase mb-3">Opponents</label>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map(num => (
              <button key={num} onClick={() => updateOpponentCount(num)}
                className={`py-2 rounded border transition-all ${opponents.length === num ? 'bg-white text-black border-white' : 'bg-stone-900 border-stone-700 text-zinc-400'}`}>
                {num}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center bg-stone-900/50 p-4 rounded-lg border border-stone-700">
          <span className="text-xs uppercase text-zinc-400">Life Total</span>
          <div className="flex items-center gap-4">
            <button onClick={() => setLifeTotal(l => Math.max(1, l - 10))} className="text-xl px-2 opacity-50 hover:opacity-100">-</button>
            <span className="text-2xl font-bold w-12 text-center tabular-nums">{lifeTotal}</span>
            <button onClick={() => setLifeTotal(l => l + 10)} className="text-xl px-2 opacity-50 hover:opacity-100">+</button>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-end mb-4">
            <label className="text-xs text-zinc-400 uppercase">Turn Order & Decks</label>
            <div className="flex gap-2">
              <button onClick={randomizeProfiles} className="text-[10px] bg-blue-900/30 text-blue-400 border border-blue-800/50 px-2 py-1 rounded hover:bg-blue-900/50 uppercase">Random Decks</button>
              <button onClick={shuffleOrder} className="text-[10px] bg-stone-700 px-2 py-1 rounded hover:bg-stone-600 uppercase">Shuffle</button>
            </div>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {participants.map((player, idx) => (
              <div key={player.id} className={`flex items-center gap-3 p-3 rounded border transition-colors ${player.type === 'user' ? 'bg-blue-900/20 border-blue-500/50' : 'bg-stone-900 border-stone-700'}`}>
                <span className="text-zinc-600 text-xs font-mono w-4">{idx + 1}</span>
                <div className="flex-1 text-sm">
                  {player.type === 'user' ? <span className="font-bold tracking-widest text-blue-400 uppercase italic">Human Player</span> :
                    <select
                      className="bg-transparent w-full focus:outline-none appearance-none cursor-pointer"
                      value={player.profileId}
                      onChange={(e) => {
                        const selected = profilesData.find(p => p.id === e.target.value);
                        const updated = [...participants];
                        updated[idx] = { ...updated[idx], name: selected.name, profileId: selected.id };
                        setParticipants(updated);
                      }}
                    >
                      {profilesData.map(p => <option key={p.id} value={p.id} className="bg-stone-900">{p.name}</option>)}
                    </select>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <button onClick={handleBegin} className="w-full bg-white text-black py-4 font-bold uppercase hover:bg-zinc-200 transition-all active:scale-95">Begin Match</button>
          <ButtonLink to="/" className="block w-full bg-stone-900 text-zinc-400 text-center py-3 font-bold uppercase border border-stone-700 hover:text-white transition-all">Back</ButtonLink>
        </div>
      </div>
    </div>
  );
}

export default NewGameScreen;