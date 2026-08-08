import { useEffect, useRef, useState } from 'react'

const BASE_INTERVAL_MS = 1400

export function usePlayback(stepCount: number) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isPlaying || stepCount === 0) {
      return
    }
    timerRef.current = window.setInterval(() => {
      setCurrentStep((current) => (current + 1) % stepCount)
    }, BASE_INTERVAL_MS / speed)

    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current)
      }
    }
  }, [isPlaying, speed, stepCount])

  const play = () => setIsPlaying(true)
  const pause = () => setIsPlaying(false)
  const restart = () => {
    setCurrentStep(0)
    setIsPlaying(true)
  }
  const stepForward = () => {
    setIsPlaying(false)
    setCurrentStep((current) => Math.min(stepCount - 1, current + 1))
  }
  const stepBackward = () => {
    setIsPlaying(false)
    setCurrentStep((current) => Math.max(0, current - 1))
  }
  const jumpTo = (index: number) => {
    setIsPlaying(false)
    setCurrentStep(Math.max(0, Math.min(stepCount - 1, index)))
  }

  return {
    currentStep,
    isPlaying,
    speed,
    setSpeed,
    play,
    pause,
    restart,
    stepForward,
    stepBackward,
    jumpTo,
  }
}
