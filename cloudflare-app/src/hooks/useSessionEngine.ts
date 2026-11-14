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
      keepAliveRef.current?.setProgressCallback(null)
      keepAliveRef.current?.stop()
      timerRef.current?.destroy()
      screenWakeRef.current?.destroy()
    }
  }, [])

  const teardownInfra = useCallback(() => {
    keepAliveRef.current?.stop()
    screenWakeRef.current?.disable()
    setProgress({ current: 0, duration: 0 })
    setTimeRemaining(0)
  }, [])

  const stopCurrentStep = useCallback(() => {
    timerRef.current?.stop()
    keepAliveRef.current?.stopPlayback()
    setTimeRemaining(0)
    setProgress({ current: 0, duration: 0 })
  }, [])

  const handleError = useCallback((err: unknown) => {
    console.error('[SessionEngine] Fatal error:', err)
    stopCurrentStep()
    teardownInfra()
    setStatusSync('error')
    setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred')

    try {
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
            if (statusRef.current === 'active') {
              advanceToNextRef.current()
            }
          })
          .catch((err) => handleError(err))

        if (devMode) {
          setTimeout(() => {
            if (statusRef.current === 'active') {
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

    stepsRef.current = steps
    indexRef.current = 0

    try {
      await keepAliveRef.current?.start()
      if (primedAudioRef.current) {
        await keepAliveRef.current?.primeForSwap(primedAudioRef.current)
      }
      await screenWakeRef.current?.enable()

      setStatusSync('active')
      setErrorMessage(null)
      executeStepRef.current(steps[0])
    } catch (err) {
      handleError(err)
    }
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
    skip,
    status,
    currentStep,
    timeRemaining,
    progress,
    errorMessage,
  }
}
