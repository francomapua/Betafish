function BulletCommanderDamage({
  disabled,
  isActive,
  isInline = false,
  opponents,
  player,
  onCommanderDamageChange,
}) {
  return (
    <div className={`${isInline ? 'min-w-0 flex-1 rounded-[1rem] border border-black/10 bg-black/10 px-2 py-1.5 shadow-inner backdrop-blur-sm' : 'mt-2 rounded-[1.2rem] border border-black/10 bg-black/10 p-2 shadow-inner backdrop-blur-sm'}`}>
      <div className={`text-[0.52rem] uppercase tracking-[0.24em] ${isActive ? 'text-black/70' : 'text-stone-300/70'}`}>
        {isInline ? 'Cmdr' : 'Commander Damage'}
      </div>

      <div className={`${isInline ? 'mt-1 grid grid-cols-3 gap-1' : 'mt-1.5 grid grid-cols-3 gap-1.5'}`}>
        {opponents.map((opponent) => {
          const damage = player.commanderDamage[opponent.id] ?? 0
          const isLethal = damage >= 21

          return (
            <div
              key={opponent.id}
              className={`grid grid-cols-[auto_auto_1fr_auto] items-center gap-1 rounded-xl border ${isInline ? 'px-1 py-0.75' : 'px-1.5 py-1'}`}
              style={{
                background: `linear-gradient(145deg, ${opponent.accent.activeStart}${isActive ? '30' : '20'} 0%, rgba(9, 12, 16, ${isActive ? '0.12' : '0.24'}) 52%, ${opponent.accent.activeEnd}${isActive ? '35' : '22'} 100%)`,
                borderColor: `${opponent.accent.accent}33`,
              }}
            >
              <button
                type="button"
                disabled={disabled}
                onClick={() => onCommanderDamageChange(player.id, opponent.id, -1)}
                className={`${isInline ? 'h-4.5 w-4.5 text-[0.65rem]' : 'h-5 w-5 text-[0.7rem]'} rounded-full border border-current/15 leading-none active:scale-95 disabled:opacity-40`}
                aria-label={`Reduce commander damage from ${opponent.name}`}
              >
                -
              </button>

              <div className={`${isInline ? 'text-[0.5rem]' : 'text-[0.56rem]'} uppercase tracking-[0.12em]`}>
                {opponent.name.replace('Player ', 'P')}
              </div>

              <div className={`min-w-4 text-center ${isInline ? 'text-[0.66rem]' : 'text-[0.72rem]'} font-semibold tabular-nums ${isLethal ? 'text-red-500' : ''}`}>
                {damage}
              </div>

              <button
                type="button"
                disabled={disabled}
                onClick={() => onCommanderDamageChange(player.id, opponent.id, 1)}
                className={`${isInline ? 'h-4.5 w-4.5 text-[0.65rem]' : 'h-5 w-5 text-[0.7rem]'} rounded-full border border-current/15 leading-none active:scale-95 disabled:opacity-40`}
                aria-label={`Increase commander damage from ${opponent.name}`}
              >
                +
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default BulletCommanderDamage