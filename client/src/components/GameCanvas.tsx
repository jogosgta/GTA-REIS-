import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { Engine } from "@babylonjs/core/Engines/engine";
import { createGameScene, type GameHandle } from "@/game/scene";

type TouchKey = "forward" | "back" | "left" | "right" | "shift";

const emitInput = (key: TouchKey, down: boolean) => {
  window.dispatchEvent(new CustomEvent("game-input", { detail: { key, down } }));
};

const hold = (key: TouchKey) => (event: ReactPointerEvent<HTMLButtonElement>) => {
  event.preventDefault();
  emitInput(key, true);
  event.currentTarget.setPointerCapture?.(event.pointerId);
};

const release = (key: TouchKey) => (event: ReactPointerEvent<HTMLButtonElement>) => {
  event.preventDefault();
  emitInput(key, false);
};

const action = (name: string) => (event: ReactPointerEvent<HTMLButtonElement>) => {
  event.preventDefault();
  window.dispatchEvent(new CustomEvent("game-action", { detail: { name } }));
};

function Joystick() {
  const padRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(false);
  const keysRef = useRef<Set<TouchKey>>(new Set());

  const setDirection = (x: number, y: number) => {
    const next = new Set<TouchKey>();
    const deadZone = 0.18;
    if (Math.abs(x) > deadZone) next.add(x > 0 ? "right" : "left");
    if (Math.abs(y) > deadZone) next.add(y < 0 ? "forward" : "back");
    keysRef.current.forEach((key) => { if (!next.has(key)) emitInput(key, false); });
    next.forEach((key) => { if (!keysRef.current.has(key)) emitInput(key, true); });
    keysRef.current = next;
    const knob = padRef.current?.querySelector<HTMLElement>(".joystick-knob");
    if (knob) {
      knob.style.transform = `translate(${Math.max(-28, Math.min(28, x * 34))}px, ${Math.max(-28, Math.min(28, y * 34))}px)`;
    }
  };

  const updateFromPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = padRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2));
    const y = ((event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2));
    const length = Math.max(1, Math.sqrt(x * x + y * y));
    setDirection(x / length, y / length);
  };

  const stop = (event?: ReactPointerEvent<HTMLDivElement>) => {
    event?.preventDefault();
    activeRef.current = false;
    keysRef.current.forEach((key) => emitInput(key, false));
    keysRef.current.clear();
    const knob = padRef.current?.querySelector<HTMLElement>(".joystick-knob");
    if (knob) knob.style.transform = "translate(0, 0)";
  };

  return (
    <div
      ref={padRef}
      className="joystick"
      aria-label="Controle de movimento"
      onPointerDown={(event) => { event.preventDefault(); activeRef.current = true; padRef.current?.setPointerCapture(event.pointerId); updateFromPointer(event); }}
      onPointerMove={(event) => { if (activeRef.current) updateFromPointer(event); }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onPointerLeave={(event) => { if (activeRef.current) updateFromPointer(event); }}
    >
      <span className="joystick-ring" />
      <span className="joystick-cross horizontal" />
      <span className="joystick-cross vertical" />
      <span className="joystick-knob"><span>✦</span></span>
    </div>
  );
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || startedRef.current) return;
    startedRef.current = true;
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: true, adaptToDeviceRatio: false });
    engine.setHardwareScalingLevel(1.2);
    let handle: GameHandle | null = null;
    let disposed = false;
    createGameScene(engine, canvas).then((next) => {
      if (disposed) { next.dispose(); return; }
      handle = next;
      let firstFrame = true;
      let qualityTimer = 0;
      engine.runRenderLoop(() => {
        next.scene.render();
        qualityTimer += engine.getDeltaTime();
        if (qualityTimer > 1400) {
          const fps = engine.getFps();
          if (fps < 34) engine.setHardwareScalingLevel(1.75);
          else if (fps < 46) engine.setHardwareScalingLevel(1.45);
          else if (fps > 56) engine.setHardwareScalingLevel(1.15);
          qualityTimer = 0;
        }
        if (firstFrame) {
          firstFrame = false;
          requestAnimationFrame(() => document.getElementById("loading-screen")?.classList.add("is-hidden"));
        }
      });
    });
    const onResize = () => engine.resize();
    window.addEventListener("resize", onResize);
    return () => {
      disposed = true;
      window.removeEventListener("resize", onResize);
      handle?.dispose();
      engine.dispose();
      startedRef.current = false;
    };
  }, []);

  return (
    <main className="game-shell">
      <canvas ref={canvasRef} className="game-canvas" style={{ touchAction: "none" }} />
      <div className="rotate-lock"><div className="rotate-icon">↔</div><strong>GIRE O CELULAR</strong><span>Jogue GTA REIS na horizontal</span></div>
      <div className="loading-screen" id="loading-screen"><div className="loading-mark">♛</div><div className="loading-title">CIDADE DE REIS</div><div className="loading-copy">Abrindo as avenidas de São Paulo...</div><div className="loading-bar"><span /></div></div>
      <div className="hud" aria-live="polite">
        <div className="hud-topline">
          <div className="brand-lockup"><div className="brand-mark">♛</div><div><div className="brand-title">GTA REIS</div><div className="brand-subtitle">SÃO PAULO · CIDADE DE REIS</div></div></div>
          <div className="stat-cluster"><div className="stat-chip"><span className="stat-label">CAIXA</span><strong id="cash">R$ 2.450</strong></div><div className="stat-chip heat"><span className="stat-label">RESPEITO</span><strong id="respect">12%</strong></div></div>
        </div>
        <div className="hud-middle">
          <div className="mini-map" id="mini-map" aria-label="Minimapa"><div className="map-grid" /><div className="map-road road-a" /><div className="map-road road-b" /><div className="map-player" /><div className="map-pin" /><span className="map-label">CENTRO</span></div>
          <div className="mission-card"><div className="mission-kicker"><span className="mission-dot" /> MISSÃO ATIVA</div><div className="mission-title" id="mission-title">Corre do Farol</div><div className="mission-copy" id="mission-copy">Passe pelos 3 pontos e entregue a cidade.</div><div className="mission-progress"><div id="mission-progress" /></div></div>
        </div>
        <div className="hud-bottom"><div className="context-card"><span className="context-icon" id="context-icon">✦</span><span id="context-text">Explore a cidade e encontre um veículo</span></div><div className="mode-pill" id="mode-pill">A PÉ</div></div>
        <div className="touch-ui" aria-label="Controles do jogo">
          <div className="movement-zone"><Joystick /><button className="sprint-btn" onPointerDown={hold("shift")} onPointerUp={release("shift")} onPointerCancel={release("shift")}><span>↯</span><small>CORRER</small></button></div>
          <div className="action-pad"><button className="round-btn horn" onPointerDown={action("horn")}><span>⌁</span><small>BUZINA</small></button><button className="round-btn enter" id="enter-btn" onPointerDown={action("interact")}><span id="enter-icon">E</span><small id="enter-label">ENTRAR</small></button></div>
        </div>
        <div className="keyboard-hint">Joystick para andar · botão amarelo aparece perto de carro ou moto · H buzina</div>
      </div>
    </main>
  );
}
