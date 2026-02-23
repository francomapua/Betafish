import React, { useState } from 'react';
import ButtonLink from '../ui/ButtonLink';
import profilesData from '../../data/profiles.json';
import betafishSvg from '../../assets/betafish.svg';
import { useNavigate } from 'react-router-dom';

function NewGameScreen() {
  const navigate = useNavigate();
  const [lifeTotal, setLifeTotal] = useState(40);
  const [opponents, setOpponents] = useState([
    { type: 'opponent', id: 1, profileId: profilesData[0].id }
  ]);
  const [participants, setParticipants] = useState([
    { type: 'user', name: 'You', id: 'user-0' },
    { type: 'opponent', id: 1, profileId: profilesData[0].id }
  ]);

  // Synchronize participants whenever opponents list changes
  const updateOpponentCount = (count) => {
    const newOpponents = Array.from({ length: count }, (_, i) => ({
      type: 'opponent',
      id: `opp-${Date.now()}-${i}`, // Use a more unique ID
      profileId: profilesData[0].id,
      name: profilesData[0].name
    }));
    setOpponents(newOpponents);
    setParticipants([{ type: 'user', name: 'You', id: 'user-0' }, ...newOpponents]);
  };

  const shuffleOrder = () => {
    setParticipants([...participants].sort(() => Math.random() - 0.5));
  };

  const handleBegin = () => {
    navigate('/game', {
      state: { participants, lifeTotal }
    });
  };

  return (
    <div className="min-h-screen bg-zinc-900 font-beleren p-6 text-white flex flex-col items-center">
      <img src={betafishSvg} className="w-16 h-16 mb-4" alt="logo" />
      <h1 className="text-4xl uppercase tracking-tighter mb-8">Match Setup</h1>

      <div className="w-full max-w-md bg-stone-800 p-6 rounded-xl border border-stone-700 shadow-2xl space-y-8">
        {/* Opponent Count Buttons */}
        <div>
          <label className="block text-xs text-zinc-400 uppercase mb-3">Number of Opponents</label>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map(num => (
              <button key={num} onClick={() => updateOpponentCount(num)}
                className={`py-2 rounded border ${opponents.length === num ? 'bg-zinc-100 text-black border-white' : 'bg-stone-900 border-stone-700 text-zinc-400'}`}>
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Starting Life */}
        <div className="flex justify-between items-center bg-stone-900/50 p-4 rounded-lg border border-stone-700">
          <span className="text-xs uppercase text-zinc-400">Starting Life</span>
          <div className="flex items-center gap-4">
            <button onClick={() => setLifeTotal(l => Math.max(1, l - 10))} className="text-xl px-2">-</button>
            <span className="text-2xl font-bold w-12 text-center">{lifeTotal}</span>
            <button onClick={() => setLifeTotal(l => l + 10)} className="text-xl px-2">+</button>
          </div>
        </div>

        {/* Turn Order & Profiles */}
        <div>
          <div className="flex justify-between items-end mb-4">
            <label className="text-xs text-zinc-400 uppercase">Turn Order</label>
            <button onClick={shuffleOrder} className="text-[10px] bg-stone-700 px-2 py-1 rounded hover:bg-stone-600 uppercase">Shuffle Order</button>
          </div>
          <div className="space-y-2">
            {participants.map((player, idx) => (
              <div key={player.id} className={`flex items-center gap-3 p-3 rounded border ${player.type === 'user' ? 'bg-blue-900/20 border-blue-500/50' : 'bg-stone-900 border-stone-700'}`}>
                <span className="text-zinc-500 text-xs">{idx + 1}</span>
                <div className="flex-1 text-sm">
                  {player.type === 'user' ? <span className="font-bold tracking-widest text-blue-400 uppercase italic">Your Seat</span> :
                    <select
                      className="bg-transparent w-full focus:outline-none"
                      value={player.profileId} // Control the value
                      onChange={(e) => {
                        const selected = profilesData.find(p => p.id === e.target.value);
                        const updated = [...participants];
                        updated[idx] = { ...updated[idx], name: selected.name, profileId: selected.id };
                        setParticipants(updated);
                      }}
                    >
                      {profilesData.map(p => (
                        <option key={p.id} value={p.id} className="bg-stone-900">{p.name}</option>
                      ))}
                    </select>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleBegin}
          className="block w-full bg-white text-black text-center py-4 font-bold uppercase hover:bg-zinc-200 transition-all"
        >
          BEGIN
        </button>
        <ButtonLink to="/" className="block w-full bg-white text-black text-center py-4 font-bold uppercase hover:bg-zinc-200 transition-all">
          Back
        </ButtonLink>
      </div>
    </div>
  );
}


export default NewGameScreen;