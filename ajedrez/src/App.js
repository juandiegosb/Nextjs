import React, { useState } from "react";
import "./App.css";
import { aStarKnight } from "./algorithm"; 
const COLS = 8;

function App() {
  const [mode, setMode] = useState("obstacles");
  const [obstacles, setObstacles] = useState(new Set());
  const [start, setStart] = useState(null);
  const [goal, setGoal] = useState(null);
  const [path, setPath] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);

  function handleCellClick(r, c) {
    const key = coordToAlg([r, c]);

    if (mode === "obstacles") {
      const newSet = new Set(obstacles);
      if (newSet.has(key)) newSet.delete(key);
      else newSet.add(key);
      setObstacles(newSet);
    } else if (mode === "path") {
      if (!start) setStart(key);
      else if (!goal) setGoal(key);
      else {
        setStart(key);
        setGoal(null);
        setPath([]);
        setCurrentStep(0);
      }
    }
  }

  function coordToAlg([r, c]) {
    return String.fromCharCode("a".charCodeAt(0) + c) + (8 - r);
  }

  function algToCoord(alg) {
    const col = alg.charCodeAt(0) - "a".charCodeAt(0);
    const row = 8 - parseInt(alg[1]);
    return [row, col];
  }

  function runAStar() {
    if (!start || !goal) {
      alert("Selecciona posición de inicio y destino");
      return;
    }
    const pawnList = Array.from(obstacles);
    const result = aStarKnight(start, goal, pawnList);
    if (!result) {
      alert("No hay camino posible");
      return;
    }
    setPath(result);
    setCurrentStep(0);
  }

  function nextMove() {
    if (currentStep < path.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }

  function isCell(r, c, type) {
    const key = coordToAlg([r, c]);
    if (type === "obstacle") return obstacles.has(key);
    if (type === "start") return start === key;
    if (type === "goal") return goal === key;
    return false;
  }

  const currentKnight =
    path.length > 0 && currentStep < path.length ? path[currentStep] : start;

  return (
    <div className="app">
      <h1>♞ Camino del Caballo</h1>

      <div className="controls">
        <button
          onClick={() => setMode("obstacles")}
          className={mode === "obstacles" ? "active" : ""}
        >
          Modo Obstáculos
        </button>
        <button
          onClick={() => setMode("path")}
          className={mode === "path" ? "active" : ""}
        >
          Modo Inicio/Fin
        </button>
        <button onClick={runAStar}>Calcular Camino</button>
        <button onClick={nextMove} disabled={!path.length}>
          Siguiente Movimiento
        </button>
      </div>

      <div className="board">
        {Array.from({ length: ROWS }).map((_, r) => (
          <div key={r} className="row">
            {Array.from({ length: COLS }).map((_, c) => {
              const key = coordToAlg([r, c]);
              const color = (r + c) % 2 === 0 ? "light" : "dark";
              let content = "";

              if (key === currentKnight) content = "♞";
              else if (isCell(r, c, "goal")) content = <span className="goal">★</span>;
              else if (isCell(r, c, "obstacle")) content = "♟";

              return (
                <div
                  key={key}
                  className={`cell ${color}`}
                  onClick={() => handleCellClick(r, c)}
                >
                  {content}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
