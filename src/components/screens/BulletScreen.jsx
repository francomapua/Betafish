import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import BulletPlayerPanel from '../bullet-mode/BulletPlayerPanel'
import useBulletSounds from '../../hooks/useBulletSounds'
import './BulletScreen.css'

const RULE_PAUSE_MS = 5000
const REFUND_MS = 10000
const DEFAULT_SETTINGS = {
  playerCount: 4,
  timeLimitMinutes: 5,
}

const PLAYER_CONFIG = [
  {
    id: 'player-1',
    name: 'Player 1',
    accent: {
      activeStart: '#f7d37a',
      activeEnd: '#f0a33b',
      accent: '#f6c453',
      shadow: 'rgba(246, 196, 83, 0.35)',
    },
  },
  {
    id: 'player-2',
    name: 'Player 2',
    accent: {
      activeStart: '#91f2c3',
      activeEnd: '#2fb086',
      accent: '#6ae2b0',
      shadow: 'rgba(106, 226, 176, 0.32)',
    },
  },
  {
    id: 'player-3',
    name: 'Player 3',
    accent: {
      activeStart: '#91d2ff',
      activeEnd: '#3f7ce0',
      accent: '#7ab7ff',
      shadow: 'rgba(122, 183, 255, 0.34)',
    },
  },
  {
    id: 'player-4',
    name: 'Player 4',
    accent: {
      activeStart: '#f4afba',
      activeEnd: '#cb5878',
      accent: '#f38ea5',
      shadow: 'rgba(243, 142, 165, 0.32)',
    },
  },
]

function createPlayers(playerCount, timeLimitMinutes) {
  const activeConfigs = PLAYER_CONFIG.slice(0, playerCount)
  const initialTimerMs = timeLimitMinutes * 60 * 1000

  return activeConfigs.map((config) => ({
    ...config,
    life: 40,
    timerMs: initialTimerMs,
    eliminated: false,
    eliminatedBy: null,
    commanderDamage: activeConfigs.reduce((totals, player) => {
      if (player.id !== config.id) {
        totals[player.id] = 0
      }

      return totals
    }, {}),
  }))
}

function formatTimer(timerMs) {
  const clamped = Math.max(0, timerMs)
  const totalSeconds = clamped / 1000
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)
  const tenths = Math.floor((clamped % 1000) / 100)

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`
}

function getNextAlivePlayerId(players, currentPlayerId) {
  const alivePlayers = players.filter((player) => !player.eliminated)

  if (alivePlayers.length <= 1) {
    return alivePlayers[0]?.id ?? null
  }

  const currentIndex = players.findIndex((player) => player.id === currentPlayerId)

  for (let step = 1; step <= players.length; step += 1) {
    const candidate = players[(currentIndex + step + players.length) % players.length]

    if (candidate && !candidate.eliminated) {
      return candidate.id
    }
  }

  return null
}

function getPlayerName(players, playerId) {
  return players.find((player) => player.id === playerId)?.name ?? 'Unknown player'
}

function resolveAlivePlayerId(players, requestedPlayerId, fallbackPlayerId = null) {
  const requestedPlayer = players.find((player) => player.id === requestedPlayerId && !player.eliminated)

  if (requestedPlayer) {
    return requestedPlayer.id
  }

  const fallbackPlayer = players.find((player) => player.id === fallbackPlayerId && !player.eliminated)

  if (fallbackPlayer) {
    return fallbackPlayer.id
  }

  const seedPlayerId = fallbackPlayerId ?? requestedPlayerId ?? players[0]?.id ?? null
  return getNextAlivePlayerId(players, seedPlayerId)
}

function getDisplaySlots(players) {
  if (players.length === 4) {
    return [players[0], players[1], players[3], players[2]]
  }

  if (players.length === 3) {
    return [players[0], players[1], null, players[2]]
  }

  if (players.length === 2) {
    return [players[0], players[1], null, null]
  }

  return [players[0] ?? null, null, null, null]
}

function getEliminationState(player, nextLife, nextCommanderDamage) {
  const timedOut = player.timerMs === 0 || player.eliminatedBy === 'time'
  const commanderEliminated = Object.values(nextCommanderDamage).some((damage) => damage >= 21)
  const lifeEliminated = nextLife === 0

  if (timedOut) {
    return { eliminated: true, eliminatedBy: 'time' }
  }

  if (commanderEliminated) {
    return { eliminated: true, eliminatedBy: 'commander' }
  }

  if (lifeEliminated) {
    return { eliminated: true, eliminatedBy: 'life' }
  }

  return { eliminated: false, eliminatedBy: null }
}

function BulletScreen() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [draftSettings, setDraftSettings] = useState(DEFAULT_SETTINGS)
  const [players, setPlayers] = useState(() => createPlayers(DEFAULT_SETTINGS.playerCount, DEFAULT_SETTINGS.timeLimitMinutes))
  const [requestedTurnOwnerId, setRequestedTurnOwnerId] = useState(PLAYER_CONFIG[0].id)
  const [requestedClockPlayerId, setRequestedClockPlayerId] = useState(PLAYER_CONFIG[0].id)
  const [priorityReturnTargetId, setPriorityReturnTargetId] = useState(null)
  const [pauseState, setPauseState] = useState({ type: 'manual' })
  const [, setPauseRemainingMs] = useState(0)
  const [switchPulseKey, setSwitchPulseKey] = useState(1)
  const [, setStatusMessage] = useState('Ready to start. Use the center controls to run the clocks.')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const sounds = useBulletSounds()
  const previousPlayersRef = useRef(players)
  const announcedWinnerRef = useRef(null)
  const lastFrameRef = useRef(0)

  const alivePlayers = players.filter((player) => !player.eliminated)
  const turnOwnerId = resolveAlivePlayerId(players, requestedTurnOwnerId)
  const clockPlayerId = resolveAlivePlayerId(players, requestedClockPlayerId, turnOwnerId)
  const clockPlayer = players.find((player) => player.id === clockPlayerId && !player.eliminated) ?? null
  const aliveCount = alivePlayers.length
  const isPaused = pauseState !== null
  const resolvedPriorityReturnTargetId = resolveAlivePlayerId(players, priorityReturnTargetId, turnOwnerId)
  const priorityReturnTarget = players.find((player) => player.id === resolvedPriorityReturnTargetId && !player.eliminated) ?? null
  const canReturnPriority = clockPlayerId !== null && priorityReturnTarget !== null && clockPlayerId !== priorityReturnTarget.id
  const displaySlots = getDisplaySlots(players)
  const isTwoPlayerMode = players.length === 2

  const setClockPlayer = (nextClockPlayerId, message, soundName) => {
    if (!nextClockPlayerId || nextClockPlayerId === clockPlayerId) {
      return
    }

    setRequestedClockPlayerId(nextClockPlayerId)
    setSwitchPulseKey((currentKey) => currentKey + 1)
    lastFrameRef.current = performance.now()
    setStatusMessage(message)
    sounds[soundName]?.()
  }

  const returnPriorityToTarget = (targetPlayerId, targetPlayerName) => {
    if (!targetPlayerId || !targetPlayerName || targetPlayerId === clockPlayerId) {
      return
    }

    setRequestedClockPlayerId(targetPlayerId)
    setPriorityReturnTargetId(null)
    setSwitchPulseKey((currentKey) => currentKey + 1)
    lastFrameRef.current = performance.now()
    setStatusMessage(`Priority returned to ${targetPlayerName}.`)
    sounds.playReturnPriority()
  }

  const passTurnTo = (nextTurnOwnerId, message) => {
    if (!nextTurnOwnerId) {
      return
    }

    setRequestedTurnOwnerId(nextTurnOwnerId)
    setRequestedClockPlayerId(nextTurnOwnerId)
    setPriorityReturnTargetId(null)
    setSwitchPulseKey((currentKey) => currentKey + 1)
    lastFrameRef.current = performance.now()
    setStatusMessage(message)
    sounds.playPass()
  }

  const tickClocks = useEffectEvent(() => {
    const now = performance.now()
    const elapsed = now - lastFrameRef.current
    lastFrameRef.current = now

    if (pauseState) {
      if (pauseState.type === 'rule6') {
        const remaining = Math.max(0, pauseState.endsAt - now)
        setPauseRemainingMs(remaining)

        if (remaining === 0) {
          setPauseState(null)
          setStatusMessage('Rule 6 pause ended. Clocks resumed.')
          sounds.playResume()
        }
      }

      return
    }

    if (!clockPlayerId) {
      return
    }

    setPlayers((currentPlayers) => currentPlayers.map((player) => {
      if (player.id !== clockPlayerId || player.eliminated) {
        return player
      }

      const nextTimerMs = Math.max(0, player.timerMs - elapsed)
      const timedOut = nextTimerMs === 0

      return {
        ...player,
        timerMs: nextTimerMs,
        eliminated: timedOut ? true : player.eliminated,
        eliminatedBy: timedOut ? 'time' : player.eliminatedBy,
      }
    }))
  })

  useEffect(() => {
    lastFrameRef.current = performance.now()
  }, [clockPlayerId, pauseState])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      tickClocks()
    }, 100)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    const previousPlayers = previousPlayersRef.current
    const newlyEliminated = players.filter((player) => {
      const previousPlayer = previousPlayers.find((candidate) => candidate.id === player.id)
      return previousPlayer && !previousPlayer.eliminated && player.eliminated
    })

    newlyEliminated.forEach((player) => {
      if (player.eliminatedBy === 'commander') {
        setStatusMessage(`${player.name} took lethal commander damage.`)
      } else if (player.eliminatedBy === 'life') {
        setStatusMessage(`${player.name} hit 0 life.`)
      } else {
        setStatusMessage(`${player.name} ran out of time.`)
      }

      sounds.playElimination()
    })

    previousPlayersRef.current = players
  }, [players, sounds])

  useEffect(() => {
    if (alivePlayers.length === 1) {
      const winner = alivePlayers[0]

      if (announcedWinnerRef.current !== winner.id) {
        announcedWinnerRef.current = winner.id
        sounds.playWin()
      }
    } else {
      announcedWinnerRef.current = null
    }
  }, [alivePlayers, sounds])

  const handleClockTap = (playerId) => {
    if (isPaused) {
      return
    }

    const tappedPlayer = players.find((player) => player.id === playerId)

    if (!tappedPlayer || tappedPlayer.eliminated) {
      return
    }

    if (playerId === clockPlayerId && playerId === turnOwnerId) {
      const nextTurnOwnerId = getNextAlivePlayerId(players, turnOwnerId)

      if (!nextTurnOwnerId || nextTurnOwnerId === turnOwnerId) {
        return
      }

      passTurnTo(nextTurnOwnerId, `${tappedPlayer.name} passed to ${getPlayerName(players, nextTurnOwnerId)}.`)
      return
    }

    if (playerId === clockPlayerId && canReturnPriority && priorityReturnTarget) {
      returnPriorityToTarget(priorityReturnTarget.id, priorityReturnTarget.name)
      return
    }

    if (playerId === turnOwnerId && canReturnPriority) {
      returnPriorityToTarget(priorityReturnTarget.id, priorityReturnTarget.name)
      return
    }

    if (playerId === clockPlayerId) {
      return
    }

    setPriorityReturnTargetId(turnOwnerId)
    setClockPlayer(playerId, `${tappedPlayer.name} took priority from ${getPlayerName(players, turnOwnerId)}.`, 'playPriority')
  }

  const handleReturnPriority = () => {
    if (!canReturnPriority || !priorityReturnTarget) {
      return
    }

    returnPriorityToTarget(priorityReturnTarget.id, priorityReturnTarget.name)
  }

  const handleLifeChange = (playerId, amount) => {
    const player = players.find((candidate) => candidate.id === playerId)

    if (!player || player.eliminatedBy === 'time') {
      return
    }

    setPlayers((currentPlayers) => currentPlayers.map((candidate) => {
      if (candidate.id !== playerId) {
        return candidate
      }

      const nextLife = Math.max(0, candidate.life + amount)
      const eliminationState = getEliminationState(candidate, nextLife, candidate.commanderDamage)

      return {
        ...candidate,
        life: nextLife,
        eliminated: eliminationState.eliminated,
        eliminatedBy: eliminationState.eliminatedBy,
      }
    }))

    setStatusMessage(`${player.name} ${amount > 0 ? 'gained' : 'lost'} ${Math.abs(amount)} life.`)

    if (amount > 0) {
      sounds.playLifeGain()
    } else {
      sounds.playLifeLoss()
    }
  }

  const handleCommanderDamageChange = (targetPlayerId, sourcePlayerId, amount) => {
    const targetPlayer = players.find((player) => player.id === targetPlayerId)
    const sourcePlayer = players.find((player) => player.id === sourcePlayerId)

    if (!targetPlayer || !sourcePlayer || targetPlayer.eliminatedBy === 'time') {
      return
    }

    const nextDamage = Math.max(0, Math.min(21, (targetPlayer.commanderDamage[sourcePlayerId] ?? 0) + amount))

    setPlayers((currentPlayers) => currentPlayers.map((candidate) => {
      if (candidate.id !== targetPlayerId) {
        return candidate
      }

      const nextCommanderDamage = {
        ...candidate.commanderDamage,
        [sourcePlayerId]: nextDamage,
      }
      const nextLife = Math.max(0, candidate.life - amount)
      const eliminationState = getEliminationState(candidate, nextLife, nextCommanderDamage)

      return {
        ...candidate,
        life: nextLife,
        commanderDamage: {
          ...nextCommanderDamage,
        },
        eliminated: eliminationState.eliminated,
        eliminatedBy: eliminationState.eliminatedBy,
      }
    }))

    setStatusMessage(`${targetPlayer.name} commander damage from ${sourcePlayer.name}: ${nextDamage}. Life ${amount > 0 ? 'down' : 'up'} ${Math.abs(amount)}.`)
    sounds.playCommander()
  }

  const handleStartPauseToggle = () => {
    if (!clockPlayer || aliveCount <= 1) {
      return
    }

    if (pauseState) {
      setPauseState(null)
      setPauseRemainingMs(0)
      lastFrameRef.current = performance.now()
      setStatusMessage(`${getPlayerName(players, clockPlayerId)} clock running.`)
      sounds.playStart()
      return
    }

    setPauseState({ type: 'manual' })
    setStatusMessage('Clocks paused.')
    sounds.playPause()
  }

  const handleRefund = () => {
    if (!clockPlayerId) {
      return
    }

    setPlayers((currentPlayers) => currentPlayers.map((player) => {
      if (player.id !== clockPlayerId || player.eliminated) {
        return player
      }

      return {
        ...player,
        timerMs: player.timerMs + REFUND_MS,
      }
    }))

    setStatusMessage(`${getPlayerName(players, clockPlayerId)} refunded 10 seconds.`)
    sounds.playRefund()
  }

  const handleOpenSettings = () => {
    if (isSettingsOpen) {
      setIsSettingsOpen(false)
      return
    }

    setDraftSettings(settings)
    setIsSettingsOpen(true)
    sounds.playMenu()
  }

  const handleApplySettings = () => {
    const nextPlayers = createPlayers(draftSettings.playerCount, draftSettings.timeLimitMinutes)
    const firstPlayerId = nextPlayers[0]?.id ?? null

    setSettings(draftSettings)
    setPlayers(nextPlayers)
    setRequestedTurnOwnerId(firstPlayerId)
    setRequestedClockPlayerId(firstPlayerId)
    setPriorityReturnTargetId(null)
    setPauseState({ type: 'manual' })
    setPauseRemainingMs(0)
    setSwitchPulseKey((currentKey) => currentKey + 1)
    setStatusMessage(`Settings applied: ${draftSettings.playerCount} players, ${draftSettings.timeLimitMinutes} minutes each.`)
    setIsSettingsOpen(false)
    announcedWinnerRef.current = null
    lastFrameRef.current = performance.now()
    sounds.playReset()
  }

  const handleReset = () => {
    const resetPlayers = createPlayers(settings.playerCount, settings.timeLimitMinutes)
    const firstPlayerId = resetPlayers[0]?.id ?? null

    setPlayers(resetPlayers)
    setRequestedTurnOwnerId(firstPlayerId)
    setRequestedClockPlayerId(firstPlayerId)
    setPriorityReturnTargetId(null)
    setPauseState({ type: 'manual' })
    setPauseRemainingMs(0)
    setSwitchPulseKey((currentKey) => currentKey + 1)
    setStatusMessage('Match reset. Press start when ready.')
    lastFrameRef.current = performance.now()
    announcedWinnerRef.current = null
    setIsSettingsOpen(false)
    sounds.playReset()
  }

  const handleRulePause = () => {
    if (pauseState || !clockPlayerId) {
      return
    }

    const now = performance.now()
    setPauseState({ type: 'rule6', endsAt: now + RULE_PAUSE_MS })
    setPauseRemainingMs(RULE_PAUSE_MS)
    lastFrameRef.current = now
    setStatusMessage('Rule 6 pause called for 5 seconds.')
    sounds.playPause()
    setIsSettingsOpen(false)
  }

  return (
    <div className="bullet-screen min-h-screen w-full overflow-hidden text-stone-50 select-none">
      <div className={`grid h-screen gap-3 p-3 md:gap-4 md:p-4 ${isTwoPlayerMode ? 'grid-cols-2 grid-rows-1' : 'grid-cols-2 grid-rows-2'}`}>
        {(isTwoPlayerMode ? players : displaySlots).map((player, index) => {
          if (!player) {
            return <div key={`empty-${index}`} className="hidden md:block" />
          }

          return (
            <BulletPlayerPanel
              key={player.id}
              player={player}
              opponents={players.filter((candidate) => candidate.id !== player.id)}
              isClockPlayer={player.id === clockPlayerId}
              isTurnOwner={player.id === turnOwnerId}
              isPaused={isPaused}
              isTopRow={isTwoPlayerMode ? index === 1 : index < 2}
              activePulseKey={switchPulseKey}
              timerLabel={formatTimer(player.timerMs)}
              onClockTap={handleClockTap}
              onLifeChange={handleLifeChange}
              onCommanderDamageChange={handleCommanderDamageChange}
              canReturnPriority={player.id === clockPlayerId && canReturnPriority}
              returnPriorityTargetName={priorityReturnTarget?.name ?? ''}
              onReturnPriority={handleReturnPriority}
            />
          )
        })}
      </div>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 py-6">
        <div className="bullet-center-dock pointer-events-none relative flex items-center justify-center">
          <div className="pointer-events-auto relative flex items-center justify-center">
            {isSettingsOpen ? (
              <div className="pointer-events-auto bullet-settings-popover absolute left-1/2 top-1/2 z-30 w-[min(90vw,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-4xl border border-white/10 p-5 shadow-2xl md:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[0.7rem] uppercase tracking-[0.35em] text-stone-300/70">Bullet Settings</div>
                    <h2 className="mt-2 text-2xl uppercase tracking-[0.18em] text-stone-50">Customize Match</h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(false)}
                    className="bullet-mini-button"
                    aria-label="Close Bullet settings"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-6 space-y-5">
                  <div>
                    <div className="text-[0.68rem] uppercase tracking-[0.32em] text-stone-300/70">Time Limit</div>
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setDraftSettings((current) => ({
                          ...current,
                          timeLimitMinutes: Math.max(1, current.timeLimitMinutes - 1),
                        }))}
                        className="bullet-mini-button"
                      >
                        -1 min
                      </button>

                      <div className="min-w-24 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center text-xl tabular-nums text-stone-50">
                        {draftSettings.timeLimitMinutes}:00
                      </div>

                      <button
                        type="button"
                        onClick={() => setDraftSettings((current) => ({
                          ...current,
                          timeLimitMinutes: Math.min(20, current.timeLimitMinutes + 1),
                        }))}
                        className="bullet-mini-button"
                      >
                        +1 min
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="text-[0.68rem] uppercase tracking-[0.32em] text-stone-300/70">Players</div>
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      {[2, 3, 4].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setDraftSettings((current) => ({ ...current, playerCount: count }))}
                          className={`bullet-mini-button ${draftSettings.playerCount === count ? 'border-amber-300/60 text-amber-100' : ''}`}
                        >
                          {count}P
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleRulePause}
                      disabled={isPaused || aliveCount <= 1}
                      className="bullet-mini-button disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Rule 6 Pause
                    </button>

                    <button
                      type="button"
                      onClick={handleReset}
                      className="bullet-mini-button"
                    >
                      Reset Match
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleApplySettings}
                      className="bullet-mini-button border-amber-300/40 text-amber-100"
                    >
                      Apply Settings
                    </button>

                    <Link
                      to="/"
                      className="bullet-mini-button flex items-center justify-center"
                    >
                      Exit
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="pointer-events-auto bullet-action-menu absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 rounded-full border border-white/10 px-4 py-3 shadow-2xl md:gap-4 md:px-5">
              <button
                type="button"
                onClick={handleStartPauseToggle}
                disabled={!clockPlayer || aliveCount <= 1}
                className={`bullet-action-button bullet-action-button-primary bullet-action-icon-button ${isPaused ? 'bullet-action-button-resume-flash' : ''} disabled:cursor-not-allowed disabled:opacity-40`}
                aria-label={isPaused ? 'Start timers' : 'Pause timers'}
              >
                <span className="sr-only">{isPaused ? 'Start timers' : 'Pause timers'}</span>
                {isPaused ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="bullet-action-icon">
                    <path d="M8 6v12l10-6-10-6Z" fill="currentColor" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="bullet-action-icon">
                    <path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                onClick={handleRefund}
                disabled={!clockPlayer || aliveCount <= 1}
                className="bullet-action-button disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Refund ten seconds to the current player"
              >
                +10s
              </button>

              <button
                type="button"
                onClick={handleOpenSettings}
                className={`bullet-action-button bullet-action-icon-button ${isSettingsOpen ? 'border-amber-300/60 text-amber-100' : ''}`}
                aria-expanded={isSettingsOpen}
                aria-label="Open Bullet settings"
              >
                <span className="sr-only">Open Bullet settings</span>
                <svg viewBox="0 0 24 24" aria-hidden="true" className="bullet-action-icon">
                  <path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.2 7.2 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.49-.42h-3.84a.5.5 0 0 0-.49.42l-.36 2.54c-.58.22-1.13.53-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.4 1.05.72 1.63.94l.36 2.54a.5.5 0 0 0 .49.42h3.84a.5.5 0 0 0 .49-.42l.36-2.54c.58-.22 1.13-.53 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7Z" fill="currentColor" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BulletScreen