import { useCallback, useRef, useState } from 'react';
import { GAME_TITLE } from '../game/constants';
import { initialStats } from '../game/stats';
import { useShooterGame } from '../game/useShooterGame';
import { Stat } from './Stat';

export function ShooterGame() {
  const canvasRef = useRef(null);
  const soundEnabledRef = useRef(true);
  const [stats, setStats] = useState(initialStats);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { start } = useShooterGame(canvasRef, setStats, soundEnabledRef);
  const isPlaying = stats.state === 'playing';
  const isGameOver = stats.state === 'gameover';

  const toggleSound = useCallback(() => {
    setSoundEnabled((enabled) => {
      soundEnabledRef.current = !enabled;
      return !enabled;
    });
  }, []);

  return (
    <main className="game-shell">
      <canvas ref={canvasRef} className="game-canvas" aria-label={`${GAME_TITLE} playfield`} />

      <div className="hud top-hud" aria-live="polite">
        <div className="brand-group">
          <div className="brand-lockup">
            <span className="signal-dot" />
            <span>{GAME_TITLE}</span>
          </div>
          <button
            type="button"
            className="sound-toggle"
            aria-label={soundEnabled ? 'Turn sound off' : 'Turn sound on'}
            aria-pressed={soundEnabled}
            onClick={toggleSound}
          >
            {soundEnabled ? 'Sound On' : 'Sound Off'}
          </button>
        </div>
        <div className="stat-row">
          <Stat label="Score" value={stats.score.toLocaleString()} />
          <Stat label="Wave" value={stats.wave} />
          <Stat label="Shields" value={stats.shields} />
        </div>
      </div>

      <div className="charge-panel" aria-label="charge">
        <span style={{ transform: `scaleX(${stats.charge / 100})` }} />
      </div>

      <div className="reticle" aria-hidden="true">
        <span />
      </div>

      {!isPlaying && (
        <section className="start-panel" aria-label={isGameOver ? 'run ended' : 'start'}>
          <div>
            <p className="kicker">{isGameOver ? 'Run Ended' : 'Ready'}</p>
            <h1>{isGameOver ? stats.score.toLocaleString() : GAME_TITLE}</h1>
            <p className="subline">{isGameOver ? `Wave ${stats.wave}` : 'Sector 7'}</p>
          </div>
          <button type="button" onClick={start}>
            {isGameOver ? 'Restart' : 'Start'}
          </button>
        </section>
      )}
    </main>
  );
}
