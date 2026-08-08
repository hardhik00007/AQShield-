import { playbackSteps } from '../lib/playbackSteps'
import { usePlayback } from '../hooks/usePlayback'
import type { PersistedRunResponse } from '../types'

const SPEED_OPTIONS = [0.5, 1, 2, 4]

export function MissionPlayback({
  latestRun,
  onStageChange,
}: {
  latestRun: PersistedRunResponse | null
  onStageChange?: (stageTitle: string) => void
}) {
  const playback = usePlayback(playbackSteps.length)
  const activeStage = playbackSteps[playback.currentStep]

  if (onStageChange) {
    onStageChange(activeStage.title)
  }

  const elapsedSeconds = playback.currentStep
  const totalSeconds = playbackSteps.length - 1

  return (
    <div className="playback-panel">
      <div className="playback-controls">
        <div className="playback-clock-inline">
          <span className="playback-clock-value">
            00:{String(elapsedSeconds).padStart(2, '0')}
          </span>
          <span className="playback-clock-total">/ 00:{String(totalSeconds).padStart(2, '0')}</span>
        </div>
        <div className="playback-btn-group">
          <button
            type="button"
            className="playback-btn"
            onClick={playback.restart}
            title="Restart"
          >
            ⟲
          </button>
          <button
            type="button"
            className="playback-btn"
            onClick={playback.stepBackward}
            title="Step back"
          >
            ◀
          </button>
          <button
            type="button"
            className="playback-btn primary"
            onClick={playback.isPlaying ? playback.pause : playback.play}
            title={playback.isPlaying ? 'Pause' : 'Play'}
          >
            {playback.isPlaying ? '⏸' : '▶'}
          </button>
          <button
            type="button"
            className="playback-btn"
            onClick={playback.stepForward}
            title="Step forward"
          >
            ▶|
          </button>
        </div>
        <div className="playback-speed">
          {SPEED_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={`speed-chip ${playback.speed === option ? 'active' : ''}`}
              onClick={() => playback.setSpeed(option)}
            >
              {option}x
            </button>
          ))}
        </div>
      </div>

      <input
        type="range"
        className="playback-scrubber"
        min={0}
        max={playbackSteps.length - 1}
        step={1}
        value={playback.currentStep}
        onChange={(event) => playback.jumpTo(Number(event.target.value))}
      />

      <div className="playback-track">
        {playbackSteps.map((step, index) => (
          <button
            type="button"
            key={step.title}
            className={`playback-step hint-anchor ${index === playback.currentStep ? 'active' : ''} ${index < playback.currentStep ? 'complete' : ''}`}
            onClick={() => playback.jumpTo(index)}
            data-hint="Jump to this mission stage."
          >
            <span className="playback-dot" />
            <div>
              <strong>{step.title}</strong>
              <p>
                {index === playback.currentStep && latestRun
                  ? `Latest action: ${latestRun.adaptation_action}`
                  : step.detail}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
