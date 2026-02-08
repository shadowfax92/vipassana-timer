import { useState, useRef, useEffect } from "react";
import type {
  SessionMode,
  ChantingDuration,
  MeditationDuration,
  InstructionType,
  Metadata,
} from "../types";
import { hasChantingsAvailable } from "../utils/chanting";

interface SessionSetupProps {
  metadata: Metadata | null;
  sessionMode: SessionMode;
  setSessionMode: (mode: SessionMode) => void;
  enableGong: boolean;
  setEnableGong: (enable: boolean) => void;
  enableInstructions: boolean;
  setEnableInstructions: (enable: boolean) => void;
  enableMetta: boolean;
  setEnableMetta: (enable: boolean) => void;
  introDuration: ChantingDuration;
  setIntroDuration: (duration: ChantingDuration) => void;
  meditationDuration: MeditationDuration;
  setMeditationDuration: (duration: MeditationDuration) => void;
  outroDuration: ChantingDuration;
  setOutroDuration: (duration: ChantingDuration) => void;
  instructionType: InstructionType;
  setInstructionType: (type: InstructionType) => void;
  onStart: () => void;
}

const CHANTING_DURATIONS: ChantingDuration[] = ["default", "2min", "5min"];
const PRESET_DURATIONS = [30, 60] as const;
const MIN_DURATION = 1;
const MAX_DURATION = 180;

export function SessionSetup({
  metadata,
  sessionMode,
  setSessionMode,
  enableGong,
  setEnableGong,
  enableInstructions,
  setEnableInstructions,
  enableMetta,
  setEnableMetta,
  introDuration,
  setIntroDuration,
  meditationDuration,
  setMeditationDuration,
  outroDuration,
  setOutroDuration,
  instructionType,
  setInstructionType,
  onStart,
}: SessionSetupProps) {
  const isPreset = PRESET_DURATIONS.includes(meditationDuration as 30 | 60);
  const [isCustomMode, setIsCustomMode] = useState(!isPreset);
  const [customValue, setCustomValue] = useState(
    isPreset ? "" : String(meditationDuration),
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCustomMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCustomMode]);

  const handlePresetClick = (duration: number) => {
    setIsCustomMode(false);
    setCustomValue("");
    setMeditationDuration(duration);
  };

  const handleCustomClick = () => {
    setIsCustomMode(true);
    if (customValue) {
      const num = parseInt(customValue);
      if (!isNaN(num)) {
        setMeditationDuration(
          Math.min(MAX_DURATION, Math.max(MIN_DURATION, num)),
        );
      }
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomValue(val);
    const num = parseInt(val);
    if (!isNaN(num) && num >= MIN_DURATION && num <= MAX_DURATION) {
      setMeditationDuration(num);
    }
  };

  const handleCustomBlur = () => {
    if (!customValue) return;
    const num = parseInt(customValue);
    if (isNaN(num) || num < MIN_DURATION) {
      setCustomValue(String(MIN_DURATION));
      setMeditationDuration(MIN_DURATION);
    } else if (num > MAX_DURATION) {
      setCustomValue(String(MAX_DURATION));
      setMeditationDuration(MAX_DURATION);
    }
  };

  return (
    <div className="setup">
      <div className="mode-selector">
        <button
          className={sessionMode === "custom" ? "selected" : ""}
          onClick={() => setSessionMode("custom")}
        >
          Custom
        </button>
        <button
          className={sessionMode === "guided" ? "selected" : ""}
          onClick={() => setSessionMode("guided")}
        >
          Guided
        </button>
      </div>

      {sessionMode === "custom" && (
        <>
          <section className="option-group">
            <h2>Gong</h2>
            <div className="button-group">
              <button
                className={!enableGong ? "selected" : ""}
                onClick={() => setEnableGong(false)}
              >
                Skip
              </button>
              <button
                className={enableGong ? "selected" : ""}
                onClick={() => setEnableGong(true)}
              >
                Play
              </button>
            </div>
          </section>

          <section className="option-group">
            <h2>Intro Chanting</h2>
            <div className="button-group">
              <button
                className={introDuration === "none" ? "selected" : ""}
                onClick={() => setIntroDuration("none")}
              >
                Skip
              </button>
              {CHANTING_DURATIONS.map((dur) => (
                <button
                  key={dur}
                  className={introDuration === dur ? "selected" : ""}
                  onClick={() => setIntroDuration(dur)}
                  disabled={!hasChantingsAvailable(metadata, dur)}
                >
                  {dur === "default" ? "Default" : dur.replace("min", " min")}
                </button>
              ))}
            </div>
          </section>

          <section className="option-group">
            <h2>Instructions</h2>
            <div className="button-group">
              <button
                className={!enableInstructions ? "selected" : ""}
                onClick={() => setEnableInstructions(false)}
              >
                Skip
              </button>
              <button
                className={enableInstructions ? "selected" : ""}
                onClick={() => setEnableInstructions(true)}
              >
                Play
              </button>
            </div>
          </section>

          <section className="option-group">
            <h2>Meditation Duration</h2>
            <div className="button-group">
              {PRESET_DURATIONS.map((dur) => (
                <button
                  key={dur}
                  className={
                    !isCustomMode && meditationDuration === dur
                      ? "selected"
                      : ""
                  }
                  onClick={() => handlePresetClick(dur)}
                >
                  {dur} min
                </button>
              ))}
              <button
                className={isCustomMode ? "selected" : ""}
                onClick={handleCustomClick}
              >
                {isCustomMode && customValue ? `${customValue} min` : "Custom"}
              </button>
            </div>
            {isCustomMode && (
              <div className="custom-duration-input">
                <input
                  ref={inputRef}
                  type="number"
                  inputMode="numeric"
                  min={MIN_DURATION}
                  max={MAX_DURATION}
                  value={customValue}
                  onChange={handleCustomChange}
                  onBlur={handleCustomBlur}
                  placeholder="45"
                />
                <span className="suffix">min</span>
              </div>
            )}
            {isCustomMode && (
              <div className="custom-duration-hint">1 – 180 minutes</div>
            )}
          </section>

          <section className="option-group">
            <h2>Metta</h2>
            <div className="button-group">
              <button
                className={!enableMetta ? "selected" : ""}
                onClick={() => setEnableMetta(false)}
              >
                Skip
              </button>
              <button
                className={enableMetta ? "selected" : ""}
                onClick={() => setEnableMetta(true)}
              >
                Play
              </button>
            </div>
          </section>

          <section className="option-group">
            <h2>Outro Chanting</h2>
            <div className="button-group">
              <button
                className={outroDuration === "none" ? "selected" : ""}
                onClick={() => setOutroDuration("none")}
              >
                Skip
              </button>
              {CHANTING_DURATIONS.map((dur) => (
                <button
                  key={dur}
                  className={outroDuration === dur ? "selected" : ""}
                  onClick={() => setOutroDuration(dur)}
                  disabled={!hasChantingsAvailable(metadata, dur)}
                >
                  {dur === "default" ? "Default" : dur.replace("min", " min")}
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {sessionMode === "guided" && (
        <section className="option-group">
          <h2>Instruction Type</h2>
          <div className="instruction-cards">
            <button
              className={`instruction-card ${instructionType === "short" ? "selected" : ""}`}
              onClick={() => setInstructionType("short")}
            >
              <span className="card-title">Short Instructions</span>
              <span className="card-duration">~1hr 6min</span>
            </button>
            <button
              className={`instruction-card ${instructionType === "long" ? "selected" : ""}`}
              onClick={() => setInstructionType("long")}
            >
              <span className="card-title">Long Instructions</span>
              <span className="card-duration">~1hr 5min</span>
            </button>
          </div>
        </section>
      )}

      <button className="start-button" onClick={onStart} disabled={!metadata}>
        {metadata ? "Start Session" : "Loading..."}
      </button>
    </div>
  );
}
