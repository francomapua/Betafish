import { useRef } from 'react'

function useBulletSounds() {
  const audioContextRef = useRef(null)

  const getAudioContext = () => {
    if (typeof window === 'undefined') {
      return null
    }

    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext

      if (!AudioContextClass) {
        return null
      }

      audioContextRef.current = new AudioContextClass()
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume()
    }

    return audioContextRef.current
  }

  const playSequence = (steps) => {
    const context = getAudioContext()

    if (!context) {
      return
    }

    const startAt = context.currentTime

    steps.forEach((step, index) => {
      const oscillator = context.createOscillator()
      const gainNode = context.createGain()
      const noteStart = startAt + index * (step.delay ?? 0.07)
      const duration = step.duration ?? 0.08

      oscillator.type = step.type ?? 'triangle'
      oscillator.frequency.setValueAtTime(step.frequency, noteStart)
      gainNode.gain.setValueAtTime(0.0001, noteStart)
      gainNode.gain.exponentialRampToValueAtTime(step.volume ?? 0.045, noteStart + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, noteStart + duration)

      oscillator.connect(gainNode)
      gainNode.connect(context.destination)
      oscillator.start(noteStart)
      oscillator.stop(noteStart + duration)
    })
  }

  return {
    playPass() {
      playSequence([
        { frequency: 540, duration: 0.08, volume: 0.05 },
        { frequency: 720, duration: 0.08, volume: 0.04 },
      ])
    },
    playPriority() {
      playSequence([
        { frequency: 700, duration: 0.06, volume: 0.045 },
        { frequency: 980, duration: 0.08, volume: 0.05 },
      ])
    },
    playReturnPriority() {
      playSequence([
        { frequency: 620, duration: 0.06, volume: 0.04 },
        { frequency: 500, duration: 0.08, volume: 0.035 },
      ])
    },
    playStart() {
      playSequence([
        { frequency: 480, duration: 0.06, volume: 0.035 },
        { frequency: 760, duration: 0.09, volume: 0.045 },
      ])
    },
    playLifeGain() {
      playSequence([
        { frequency: 520, duration: 0.08, volume: 0.04 },
        { frequency: 660, duration: 0.1, volume: 0.045 },
      ])
    },
    playLifeLoss() {
      playSequence([
        { frequency: 340, duration: 0.08, volume: 0.05, type: 'sawtooth' },
        { frequency: 250, duration: 0.12, volume: 0.04, type: 'sawtooth' },
      ])
    },
    playCommander() {
      playSequence([
        { frequency: 430, duration: 0.06, volume: 0.04 },
        { frequency: 430, duration: 0.08, volume: 0.05 },
      ])
    },
    playPause() {
      playSequence([
        { frequency: 660, duration: 0.06, volume: 0.035 },
        { frequency: 440, duration: 0.18, volume: 0.04 },
      ])
    },
    playResume() {
      playSequence([
        { frequency: 440, duration: 0.05, volume: 0.03 },
        { frequency: 620, duration: 0.08, volume: 0.04 },
      ])
    },
    playElimination() {
      playSequence([
        { frequency: 260, duration: 0.1, volume: 0.06, type: 'sawtooth' },
        { frequency: 190, duration: 0.16, volume: 0.05, type: 'square' },
      ])
    },
    playWin() {
      playSequence([
        { frequency: 520, duration: 0.08, volume: 0.04 },
        { frequency: 780, duration: 0.09, volume: 0.05 },
        { frequency: 1040, duration: 0.14, volume: 0.05 },
      ])
    },
    playReset() {
      playSequence([
        { frequency: 300, duration: 0.06, volume: 0.03 },
        { frequency: 460, duration: 0.07, volume: 0.035 },
        { frequency: 620, duration: 0.09, volume: 0.04 },
      ])
    },
    playRefund() {
      playSequence([
        { frequency: 880, duration: 0.05, volume: 0.035 },
        { frequency: 1040, duration: 0.07, volume: 0.045 },
      ])
    },
    playMenu() {
      playSequence([
        { frequency: 420, duration: 0.05, volume: 0.025 },
        { frequency: 560, duration: 0.07, volume: 0.03 },
      ])
    },
  }
}

export default useBulletSounds