/**
 * Painel de configurações (sobreposição lateral). Todos os ajustes são salvos
 * automaticamente no LocalStorage pelo hook useSettings.
 */

import type { Settings } from '../types';

interface Props {
  settings: Settings;
  onChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  onReset: () => void;
  onClose: () => void;
  /** Vozes disponíveis (ordenadas da melhor para a pior). */
  voices: SpeechSynthesisVoice[];
  /** Toca uma amostra ("Sim") com a voz atual. */
  onTestVoice: () => void;
}

export function SettingsPanel({
  settings,
  onChange,
  onReset,
  onClose,
  voices,
  onTestVoice,
}: Props) {
  return (
    <div className="panel">
      <div className="panel__header">
        <h2>Configurações</h2>
        <button className="btn btn--ghost" onClick={onClose}>
          Fechar
        </button>
      </div>

      <div className="panel__body">
        {/* Tempo de confirmação */}
        <label className="field">
          <span>
            Tempo para confirmar: <strong>{(settings.confirmationTimeMs / 1000).toFixed(1)}s</strong>
          </span>
          <input
            type="range"
            min={1000}
            max={6000}
            step={250}
            value={settings.confirmationTimeMs}
            onChange={(e) => onChange('confirmationTimeMs', Number(e.target.value))}
          />
        </label>

        {/* Cooldown */}
        <label className="field">
          <span>
            Cooldown (espera após resposta):{' '}
            <strong>{(settings.cooldownMs / 1000).toFixed(1)}s</strong>
          </span>
          <input
            type="range"
            min={0}
            max={6000}
            step={250}
            value={settings.cooldownMs}
            onChange={(e) => onChange('cooldownMs', Number(e.target.value))}
          />
        </label>

        {/* Sensibilidade */}
        <label className="field">
          <span>
            Sensibilidade: <strong>{Math.round(settings.sensitivity * 100)}%</strong>
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.sensitivity}
            onChange={(e) => onChange('sensitivity', Number(e.target.value))}
          />
          <small>Maior = dispara mais fácil.</small>
        </label>

        {/* Zona morta */}
        <label className="field">
          <span>
            Zona morta central: <strong>{settings.deadZone.toFixed(2)}</strong>
          </span>
          <input
            type="range"
            min={0}
            max={0.3}
            step={0.01}
            value={settings.deadZone}
            onChange={(e) => onChange('deadZone', Number(e.target.value))}
          />
          <small>Maior = evita disparos acidentais perto do centro.</small>
        </label>

        {/* Suavização */}
        <label className="field">
          <span>
            Suavização: <strong>{settings.smoothingWindow} amostras</strong>
          </span>
          <input
            type="range"
            min={1}
            max={20}
            step={1}
            value={settings.smoothingWindow}
            onChange={(e) => onChange('smoothingWindow', Number(e.target.value))}
          />
          <small>Maior = mais estável, porém responde um pouco mais devagar.</small>
        </label>

        {/* Switches */}
        <label className="switch">
          <input
            type="checkbox"
            checked={settings.audioEnabled}
            onChange={(e) => onChange('audioEnabled', e.target.checked)}
          />
          <span>Falar a resposta (áudio)</span>
        </label>

        {/* Seleção de voz */}
        <label className="field">
          <span>Voz</span>
          <select
            value={settings.voiceURI}
            onChange={(e) => onChange('voiceURI', e.target.value)}
          >
            <option value="">Automático (melhor voz disponível)</option>
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
          <button type="button" className="btn btn--ghost" onClick={onTestVoice}>
            🔊 Testar voz
          </button>
          <small>
            Dica: a voz "Google português do Brasil" costuma ser a mais natural.
            Se a lista estiver curta, veja o README (como instalar mais vozes).
          </small>
        </label>

        <label className="switch">
          <input
            type="checkbox"
            checked={settings.showVideo}
            onChange={(e) => onChange('showVideo', e.target.checked)}
          />
          <span>Mostrar vídeo da câmera</span>
        </label>

        <label className="switch">
          <input
            type="checkbox"
            checked={settings.invertSides}
            onChange={(e) => onChange('invertSides', e.target.checked)}
          />
          <span>Inverter lados (se SIM/NÃO saírem trocados)</span>
        </label>

        <label className="switch">
          <input
            type="checkbox"
            checked={settings.debugMode}
            onChange={(e) => onChange('debugMode', e.target.checked)}
          />
          <span>Modo de depuração (mostrar pontos)</span>
        </label>

        <button className="btn btn--ghost panel__reset" onClick={onReset}>
          Restaurar padrões
        </button>
      </div>
    </div>
  );
}
