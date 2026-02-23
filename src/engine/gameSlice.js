import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  history: [],
  current: {
    gameMeta: { name: "", turn: 1 },
    entities: {}, // { "player": { hp: 20 }, "opp_01": { hp: 20, wincons: 0 } }
    turnManager: { turnOrder: [], activeIndex: 0, pendingAction: null }
  }
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    startGame: (state, action) => {
      // Setup entities, starting health, and randomized turn order here
      state.current = action.payload;
      state.history = [];
    },
    proposeAction: (state, action) => {
      // AI proposes an action; UI pauses waiting for user arbitration
      state.current.turnManager.pendingAction = action.payload;
    },
    resolveAction: (state, action) => {
      // 1. Snapshot current state for Undo before mutating
      state.history.push(JSON.parse(JSON.stringify(state.current)));

      const { targetId, damage, winconProgress, isNegated } = action.payload;

      // 2. Apply the action if the user didn't negate it
      if (!isNegated) {
        if (damage) state.current.entities[targetId].hp -= damage;
        if (winconProgress) state.current.entities[targetId].wincons += winconProgress;
      }

      // 3. Clear the stack
      state.current.turnManager.pendingAction = null;
    },
    passTurn: (state) => {
      state.history.push(JSON.parse(JSON.stringify(state.current)));

      const { turnOrder, activeIndex } = state.current.turnManager;
      const nextIndex = (activeIndex + 1) % turnOrder.length;

      state.current.turnManager.activeIndex = nextIndex;
      if (nextIndex === 0) state.current.gameMeta.turn += 1; // Back to player
    },
    undo: (state) => {
      if (state.history.length === 0) return;
      // Pop the last snapshot and overwrite the current state
      state.current = state.history.pop();
    }
  }
});

export const { startGame, proposeAction, resolveAction, passTurn, undo } = gameSlice.actions;
export default gameSlice.reducer;