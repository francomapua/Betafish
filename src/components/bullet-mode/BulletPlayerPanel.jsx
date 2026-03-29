import BulletCommanderDamage from './BulletCommanderDamage'

function BulletPlayerPanel({
  activePulseKey,
  canReturnPriority,
  isClockPlayer,
  isPaused,
  isTopRow,
  isTurnOwner,
  onClockTap,
  onCommanderDamageChange,
  onLifeChange,
  onReturnPriority,
  opponents,
  player,
  returnPriorityTargetName,
  timerLabel,
}) {
  const isEliminated = player.eliminated
  const isActive = isClockPlayer
  const controlsLocked = player.eliminatedBy === 'time'
  const shouldSwapHeaderSides = player.id === 'player-1' || player.id === 'player-3'
  const panelStyle = isEliminated
    ? {
      background: 'linear-gradient(160deg, #23161b 0%, #140d10 100%)',
      borderColor: 'rgba(248, 113, 113, 0.35)',
      boxShadow: 'inset 0 0 0 1px rgba(248, 113, 113, 0.15)',
      color: '#f5d0d0',
    }
    : isActive
      ? {
        background: `linear-gradient(160deg, ${player.accent.activeStart} 0%, ${player.accent.activeEnd} 100%)`,
        borderColor: player.accent.accent,
        boxShadow: `0 22px 60px ${player.accent.shadow}, inset 0 0 0 1px rgba(0, 0, 0, 0.05)`,
        color: '#15120c',
      }
      : {
        background: `linear-gradient(160deg, ${player.accent.activeStart}20 0%, #10161d 35%, ${player.accent.activeEnd}26 100%)`,
        borderColor: `${player.accent.accent}55`,
        boxShadow: `inset 0 0 0 1px ${player.accent.accent}18`,
        color: '#f8fafc',
      }

  return (
    <section
      className="relative overflow-hidden rounded-4xl border p-2.5 shadow-2xl md:p-3"
      style={panelStyle}
    >
      {isActive && !isEliminated ? (
        <div
          key={`${player.id}-${activePulseKey}`}
          className="animate-bullet-switch-flash pointer-events-none absolute inset-0 rounded-4xl"
          style={{ background: `radial-gradient(circle, ${player.accent.accent}80 0%, transparent 60%)` }}
        />
      ) : null}

      <div className={`flex h-full flex-col gap-2 ${isTopRow ? 'rotate-180' : ''}`}>
        <div className="rounded-3xl border border-current/10 bg-black/10 px-3 py-2.5 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className={`${shouldSwapHeaderSides ? 'order-3 text-right' : 'order-1'} shrink-0`}>
              <div className={`text-[0.62rem] uppercase tracking-[0.34em] ${isActive ? 'text-black/65' : 'text-white/55'}`}>
                {isEliminated ? 'Eliminated' : isActive ? 'Clock Running' : isTurnOwner ? 'Turn Owner' : 'Waiting'}
              </div>
              <h2 className="mt-0.5 text-lg uppercase tracking-[0.16em] md:text-xl">{player.name}</h2>
            </div>

            <div className="order-2 min-w-0 flex-1">
              <BulletCommanderDamage
                disabled={controlsLocked}
                isActive={isActive}
                isInline
                opponents={opponents}
                player={player}
                onCommanderDamageChange={onCommanderDamageChange}
              />
            </div>

            <div className={`${shouldSwapHeaderSides ? 'order-1 text-left' : 'order-3 text-right'} min-w-20 shrink-0`}>
              <div className={`text-[0.6rem] uppercase tracking-[0.28em] ${isActive ? 'text-black/65' : 'text-white/55'}`}>
                ______
              </div>
              <div className="text-3xl font-semibold tabular-nums md:text-4xl">{player.life}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={controlsLocked}
            onClick={() => onLifeChange(player.id, -1)}
            className="rounded-[1.2rem] border border-current/10 bg-black/12 px-3 py-2.5 text-base font-semibold tracking-[0.14em] active:scale-[0.98] disabled:opacity-40"
            aria-label={`Subtract one life from ${player.name}`}
          >
            -1
          </button>

          <button
            type="button"
            disabled={controlsLocked}
            onClick={() => onLifeChange(player.id, 1)}
            className="rounded-[1.2rem] border border-current/10 bg-black/12 px-3 py-2.5 text-base font-semibold tracking-[0.14em] active:scale-[0.98] disabled:opacity-40"
            aria-label={`Add one life to ${player.name}`}
          >
            +1
          </button>

          <button
            type="button"
            disabled={controlsLocked}
            onClick={() => onLifeChange(player.id, -5)}
            className="rounded-[1.2rem] border border-current/10 bg-black/12 px-3 py-2.5 text-base font-semibold tracking-[0.14em] active:scale-[0.98] disabled:opacity-40"
            aria-label={`Subtract five life from ${player.name}`}
          >
            -5
          </button>

          <button
            type="button"
            disabled={controlsLocked}
            onClick={() => onLifeChange(player.id, 5)}
            className="rounded-[1.2rem] border border-current/10 bg-black/12 px-3 py-2.5 text-base font-semibold tracking-[0.14em] active:scale-[0.98] disabled:opacity-40"
            aria-label={`Add five life to ${player.name}`}
          >
            +5
          </button>
        </div>

        <button
          type="button"
          disabled={isEliminated}
          onClick={() => onClockTap(player.id)}
          className={`bullet-clock-button relative flex min-h-20 flex-1 flex-col items-center justify-center rounded-4xl border px-4 py-4 text-center active:scale-[0.985] disabled:opacity-40 md:min-h-48 ${isPaused ? 'animate-bullet-pause-pulse' : ''} ${isActive ? 'border-black/20 bg-black/12' : 'border-white/10 bg-black/18'}`}
          aria-label={isActive ? `Pass turn from ${player.name}` : `Start ${player.name}'s clock`}
        >
          <div className={`text-[0.66rem] uppercase tracking-[0.35em] ${isActive ? 'text-black/70' : 'text-white/60'}`}>
            {isEliminated
              ? 'Clock stopped'
              : isPaused
                ? 'Paused'
                : canReturnPriority
                  ? 'Resolve then return'
                  : isTurnOwner
                    ? 'Tap to pass left'
                    : 'Tap to take priority'}
          </div>

          <div className="mt-2 text-4xl font-semibold tracking-widest tabular-nums md:text-6xl">
            {timerLabel}
          </div>

          <div className={`mt-2 text-[0.68rem] uppercase tracking-[0.28em] ${isActive ? 'text-black/70' : 'text-white/55'}`}>
            {isEliminated ? 'Out of the game' : isActive ? 'Running' : isTurnOwner ? 'Turn owner' : 'Waiting'}
          </div>
        </button>

        {canReturnPriority ? (
          <button
            type="button"
            onClick={onReturnPriority}
            className="rounded-[1.2rem] border border-current/10 bg-black/12 px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] active:scale-[0.98]"
            aria-label={`Return priority to ${returnPriorityTargetName}`}
          >
            Return to {returnPriorityTargetName}
          </button>
        ) : null}

      </div>
    </section>
  )
}

export default BulletPlayerPanel