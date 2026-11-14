import { useState, useRef, useCallback, useEffect } from 'react'
import { MediaKeepAlive } from '../lib/MediaKeepAlive'
import { ReliableTimer } from '../lib/ReliableTimer'
import { ScreenWake } from '../lib/ScreenWake'
import type { SessionStep, SessionStatus, AudioProgress } from '../types'

export function useSessionEngine() {
  const [status, setStatus] = useState<SessionStatus>('idle')
  const [currentStep, setCurrentStep] = useState<SessionStep | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [progress, setProgress] = useState<AudioProgress>({ current: 0, duration: 0 })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const stepsRef = useRef<SessionStep[]>([])
  const indexRef = useRef(0)
  const statusRef = useRef<SessionStatus>('idle')
  const generationRef = useRef(0)
  const invalidatePlayback = useCallback(() => { ++generationRef.current }, [])

  const keepAliveRef = useRef<MediaKeepAlive | null>(null)
  const timerRef = useRef<ReliableTimer | null>(null)
  const screenWakeRef = useRef<ScreenWake | null>(null)
  const primedAudioRef = useRef<HTMLAudioElement | null>(null)

  // Refs for mutually-recursive functions (breaks useCallback circular dep)
  const executeStepRef = useRef<(step: SessionStep) => void>(() => {})
  const advanceToNextRef = useRef<() => void>(() => {})

  // Sync wrapper: always update ref AND React state together
  const setStatusSync = useCallback((s: SessionStatus) => {
    statusRef.current = s
    setStatus(s)
  }, [])

  // Initialize infrastructure (created once, never recreated)
  useEffect(() => {
    keepAliveRef.current = new MediaKeepAlive()
    keepAliveRef.current.setProgressCallback(setProgress)

    primedAudioRef.current = new Audio()
    primedAudioRef.current.setAttribute('playsinline', 'true')

    screenWakeRef.current = new ScreenWake()

    timerRef.current = new ReliableTimer({
      onTick: setTimeRemaining,
      onComplete: () => advanceToNextRef.current(),
    })

    return () => {
      invalidatePlayback()
      keepAliveRef.current?.setProgressCallback(null)
      keepAliveRef.current?.stop()
      timerRef.current?.destroy()
      screenWakeRef.current?.destroy()
    }
  }, [invalidatePlayback])

  const teardownInfra = useCallback(() => {
    keepAliveRef.current?.stop()
    screenWakeRef.current?.disable()
    setProgress({ current: 0, duration: 0 })
    setTimeRemaining(0)
  }, [])

  const stopCurrentStep = useCallback(() => {
    invalidatePlayback()
    timerRef.current?.stop()
    keepAliveRef.current?.stopPlayback()
    setTimeRemaining(0)
    setProgress({ current: 0, duration: 0 })
  }, [invalidatePlayback])

  const handleError = useCallback((err: unknown) => {
    console.error('[SessionEngine] Fatal error:', err)
    stopCurrentStep()
    teardownInfra()
    setStatusSync('error')
    setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred')

    try {
      if (stepsRef.current[indexRef.current]?.id === 'vipassana_guided') return
      const errorAudio = new Audio('/audio/gong.mp3')
      errorAudio.play().catch(() => {})
    } catch {
      // best effort
    }
  }, [stopCurrentStep, teardownInfra, setStatusSync])

  // Keep refs wired to latest versions
  useEffect(() => {
    const devMode = import.meta.env.VITE_DEV_MODE === 'true'
    const devSeconds = parseInt(import.meta.env.VITE_DEV_MEDITATION_SECONDS || '30', 10)

    executeStepRef.current = (step: SessionStep) => {
      const generation = ++generationRef.current
      setCurrentStep(step)
      setTimeRemaining(0)
      setProgress({ current: 0, duration: 0 })

      if (step.type === 'timer') {
        const seconds = devMode
          ? step.durationSeconds! / 60
          : step.durationSeconds!
        timerRef.current?.start(seconds)
        return
      }

      if (step.type === 'audio' && step.audioSrc) {
        keepAliveRef.current?.swapAndPlay(step.audioSrc, { fadeInSeconds: step.fadeInSeconds })
          .then(() => {
            if (generation === generationRef.current && (statusRef.current === 'active' || statusRef.current === 'paused')) {
              advanceToNextRef.current()
            }
          })
          .catch((err) => { if (generation === generationRef.current) handleError(err) })

        if (devMode && step.id !== 'vipassana_guided') {
          setTimeout(() => {
            if (generation === generationRef.current && statusRef.current === 'active') {
              stopCurrentStep()
              advanceToNextRef.current()
            }
          }, devSeconds * 1000)
        }
      }
    }

    advanceToNextRef.current = () => {
      const steps = stepsRef.current
      const idx = indexRef.current

      if (idx >= steps.length - 1) {
        setStatusSync('complete')
        setCurrentStep(null)
        teardownInfra()
      } else {
        indexRef.current = idx + 1
        executeStepRef.current(steps[idx + 1])
      }
    }
  }, [handleError, stopCurrentStep, teardownInfra, setStatusSync])

  const startSession = useCallback(async (steps: SessionStep[]) => {
    if (steps.length === 0) return
    stopCurrentStep()
    teardownInfra()
    const generation = generationRef.current
    stepsRef.current = steps
    indexRef.current = 0

    try {
      await keepAliveRef.current?.start()
      if (generation !== generationRef.current) return
      if (primedAudioRef.current) {
        await keepAliveRef.current?.primeForSwap(primedAudioRef.current)
      }
      if (generation !== generationRef.current) return
      await screenWakeRef.current?.enable()
      if (generation !== generationRef.current) return

      setStatusSync('active')
      setErrorMessage(null)
      executeStepRef.current(steps[0])
    } catch (err) {
      if (generation === generationRef.current) handleError(err)
    }
  }, [handleError, setStatusSync, stopCurrentStep, teardownInfra])

  const resetSession = useCallback(() => { void startSession(stepsRef.current) }, [startSession])

  const pause = useCallback(() => {
    if (statusRef.current !== 'active' || stepsRef.current[indexRef.current]?.id !== 'vipassana_guided') return
    setStatusSync('paused')
    keepAliveRef.current?.pausePlayback()
  }, [setStatusSync])

  const resume = useCallback(async () => {
    if (statusRef.current !== 'paused') return
    const generation = generationRef.current
    setStatusSync('active')
    try { await keepAliveRef.current?.resumePlayback() }
    catch (err) { if (generation === generationRef.current) handleError(err) }
  }, [handleError, setStatusSync])

  const stopSession = useCallback(() => {
    stopCurrentStep()
    teardownInfra()
    setStatusSync('idle')
    setCurrentStep(null)
    setErrorMessage(null)
  }, [stopCurrentStep, teardownInfra, setStatusSync])

  const skip = useCallback(() => {
    stopCurrentStep()
    advanceToNextRef.current()
  }, [stopCurrentStep])

  return {
    startSession,
    stopSession,
    resetSession,
    pause,
    resume,
    skip,
    status,
    currentStep,
    timeRemaining,
    progress,
    errorMessage,
  }
}
