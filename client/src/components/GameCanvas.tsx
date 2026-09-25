import { useEffect, useRef, type PointerEvent } from "react";
import { Engine } from "@babylonjs/core/Engines/engine";
import { createGameScene, type GameHandle } from "@/game/scene";

const hold = (key: string) => (event: PointerEvent<HTMLButtonElement>) => {
  event.preventDefault();
  window.dispatchEvent(new CustomEvent("game-input", { detail: { key, down: true } }));
  event.currentTarget.setPointerCapture?.(event.pointerId);
};
const release = (key: string) => (event: PointerEvent<HTMLButtonElement>) => {
  event.preventDefault();
  window.dispatchEvent(new CustomEvent("game-input", { detail: { key, down: false } }));
};
const action = (name: string) => (event: PointerEvent<HTMLButtonElement>) => {
  event.preventDefault();
  window.dispatchEvent(new CustomEvent("game-action", { detail: { name } }));
};

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || startedRef.current) return;
    startedRef.current = true;
    const engine = new Engine(canvas, true, {
      preserveDrawingBuffer: false,
      stencil: true,
      adaptToDeviceRatio: false,
    });
    engine.setHardwareScalingLevel(1.2);
    let handle: GameHandle | null = null;
    let disposed = false;
    createGameScene(engine, canvas).then((next) => {
      if (disposed) {
        next.dispose();
        return;
      }
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
      <div className="loading-screen" id="loading-screen">
        <div className="loading-mark">♛</div>
        <div className="loading-title">CIDADE DE REIS</div>
        <div className="loading-copy">Abrindo as avenidas de São Paulo...</div>
        <div className="loading-bar"><span /></div>
      </div>
      <div className="hud" aria-live="polite">
        <div className="hud-topline">
          <div className="brand-lockup">
            <div className="brand-mark">♛</div>
            <div>
              <div className="brand-title">GTA REIS</div>
              <div className="brand-subtitle">SÃO PAULO · CIDADE DE REIS</div>
            </div>
          </div>
          <div className="stat-cluster">
            <div className="stat-chip"><span className="stat-label">CAIXA</span><strong id="cash">R$ 2.450</strong></div>
            <div className="stat-chip heat"><span className="stat-label">RESPEITO</span><strong id="respect">12%</strong></div>
          </div>
        </div>

        <div className="hud-middle">
          <div className="mini-map" id="mini-map" aria-label="Minimapa">
            <div className="map-grid" />
            <div className="map-road road-a" />
            <div className="map-road road-b" />
            <div className="map-player" />
            <div className="map-pin" />
            <span className="map-label">CENTRO</span>
          </div>
          <div className="mission-card">
            <div className="mission-kicker"><span className="mission-dot" /> MISSÃO ATIVA</div>
            <div className="mission-title" id="mission-title">Corre do Farol</div>
            <div className="mission-copy" id="mission-copy">Passe pelos 3 pontos e entregue a cidade.</div>
            <div className="mission-progress"><div id="mission-progress" /></div>
          </div>
        </div>

        <div className="hud-bottom">
          <div className="context-card">
            <span className="context-icon" id="context-icon">✦</span>
            <span id="context-text">Explore a cidade e encontre um veículo</span>
          </div>
          <div className="mode-pill" id="mode-pill">A PÉ</div>
        </div>

        <div className="touch-ui" aria-label="Controles do jogo">
          <div className="touch-pad">
            <button className="touch-btn up" onPointerDown={hold("forward")} onPointerUp={release("forward")} onPointerCancel={release("forward")}>▲</button>
            <button className="touch-btn left" onPointerDown={hold("left")} onPointerUp={release("left")} onPointerCancel={release("left")}>◀</button>
            <button className="touch-btn down" onPointerDown={hold("back")} onPointerUp={release("back")} onPointerCancel={release("back")}>▼</button>
            <button className="touch-btn right" onPointerDown={hold("right")} onPointerUp={release("right")} onPointerCancel={release("right")}>▶</button>
          </div>
          <div className="action-pad">
            <button className="round-btn horn" onPointerDown={action("horn")}>H</button>
            <button className="round-btn enter" onPointerDown={action("interact")}><span id="enter-icon">E</span></button>
          </div>
        </div>
        <div className="keyboard-hint">WASD / setas para mover · E/F interage · H buzina · Shift corre</div>
      </div>
    </main>
  );
}
