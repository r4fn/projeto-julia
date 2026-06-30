/**
 * Componente raiz: orquestra câmera, rastreamento, calibração, temporizador,
 * áudio e interface. A lógica pesada vive nos hooks; aqui só montamos a tela.
 */

import { useCallback, useRef, useState } from 'react';
import { CameraView } from './components/CameraView';
import { ProgressBar } from './components/ProgressBar';
import { AnswerDisplay } from './components/AnswerDisplay';
import { SettingsPanel } from './components/SettingsPanel';
import { CalibrationWizard } from './components/CalibrationWizard';
import { DebugOverlay } from './components/DebugOverlay';
import { useSettings } from './hooks/useSettings';
import { useCamera } from './hooks/useCamera';
import { useEyeTracking } from './hooks/useEyeTracking';
import { useCalibration } from './hooks/useCalibration';
import { useConfirmationTimer } from './hooks/useConfirmationTimer';
import { useSpeech } from './hooks/useSpeech';
import type { Answer, GazeSample } from './types';
import './App.css';

const INITIAL_SAMPLE: GazeSample = {
  faceDetected: false,
  ratio: 0.5,
  direction: 'center',
  blink: false,
  confidence: 0,
};

export default function App() {
  const { settings, update, reset } = useSettings();
  const { videoRef, status, error, start, ready } = useCamera();
  const overlayRef = useRef<HTMLCanvasElement>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<Answer | null>(null);

  const { speak, voices } = useSpeech(settings.voiceURI);

  // Ref compartilhada entre rastreador (escreve) e calibração (lê).
  // Criada aqui no App para evitar dependência circular entre os hooks.
  const latestRef = useRef<GazeSample>(INITIAL_SAMPLE);

  // Calibração primeiro: ela só precisa da ref (que já existe), e produz a
  // calibração que o rastreador consome.
  const calib = useCalibration(latestRef);

  // Rastreamento ocular (processa apenas quando a câmera está pronta).
  const { sample, modelReady } = useEyeTracking({
    videoRef,
    overlayRef,
    calibration: calib.calibration,
    settings,
    enabled: ready,
    latestRef,
  });

  // Ao confirmar uma resposta: exibe e (se habilitado) fala.
  const handleConfirm = useCallback(
    (answer: Answer) => {
      setCurrentAnswer(answer);
      if (settings.audioEnabled) {
        speak(answer === 'SIM' ? 'Sim' : 'Não');
      }
    },
    [settings.audioEnabled, speak],
  );

  // Temporizador de confirmação. Desligado durante a calibração.
  const { progress, inCooldown } = useConfirmationTimer({
    direction: sample.direction,
    settings,
    enabled: ready && !calib.isCalibrating,
    onConfirm: handleConfirm,
  });

  const handleRestart = () => setCurrentAnswer(null);

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Projeto Julia</h1>
        <p className="app__subtitle">Comunicador por movimento ocular</p>
      </header>

      {/* O elemento <video> precisa existir no DOM ANTES de chamarmos a câmera,
          pois useCamera atribui o stream a ele. Por isso ele fica sempre
          montado; quando a câmera não está pronta (ou "showVideo" desligado),
          apenas o ocultamos via CSS. */}
      <CameraView
        videoRef={videoRef}
        overlayRef={overlayRef}
        hidden={status !== 'ready' || !settings.showVideo}
      />

      {/* Tela inicial: pedir câmera */}
      {status !== 'ready' && (
        <div className="start">
          {status === 'error' ? (
            <>
              <p className="start__error">{error}</p>
              <button className="btn btn--primary" onClick={start}>
                Tentar novamente
              </button>
            </>
          ) : (
            <>
              <p className="start__text">
                Para começar, autorize o acesso à câmera deste dispositivo.
              </p>
              <button
                className="btn btn--primary"
                onClick={start}
                disabled={status === 'requesting'}
              >
                {status === 'requesting' ? 'Solicitando…' : 'Ativar câmera'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Área principal */}
      {status === 'ready' && (
        <main className="app__main">
          <AnswerDisplay
            answer={currentAnswer}
            direction={sample.direction}
            faceDetected={sample.faceDetected}
          />

          <ProgressBar
            progress={progress}
            direction={sample.direction}
            invertSides={settings.invertSides}
          />

          <div className="status-row">
            <span className={`pill ${sample.faceDetected ? 'pill--ok' : 'pill--off'}`}>
              {sample.faceDetected ? 'Rosto OK' : 'Sem rosto'}
            </span>
            {!calib.calibration.calibrated && (
              <span className="pill pill--warn">Não calibrado</span>
            )}
            {inCooldown && <span className="pill pill--cool">Cooldown…</span>}
            {!modelReady && <span className="pill pill--warn">Carregando modelo…</span>}
          </div>

          <div className="controls">
            <button className="btn btn--ghost" onClick={handleRestart}>
              Reiniciar
            </button>
            <button className="btn btn--ghost" onClick={calib.start}>
              Recalibrar
            </button>
            <button className="btn btn--ghost" onClick={() => setShowSettings(true)}>
              Configurações
            </button>
          </div>

          {settings.debugMode && <DebugOverlay sample={sample} progress={progress} />}
        </main>
      )}

      {/* Sobreposições */}
      {calib.isCalibrating && (
        <CalibrationWizard
          stepIndex={calib.stepIndex}
          totalSteps={calib.totalSteps}
          currentStep={calib.currentStep}
          currentLabel={calib.currentLabel}
          capturing={calib.capturing}
          faceDetected={sample.faceDetected}
          onCapture={calib.captureCurrent}
          onCancel={calib.cancel}
        />
      )}

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onChange={update}
          onReset={reset}
          onClose={() => setShowSettings(false)}
          voices={voices}
          onTestVoice={() => speak('Sim')}
        />
      )}
    </div>
  );
}
