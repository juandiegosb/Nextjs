'use client'
import { useState } from 'react'

function Square({ value, onClick }) {
  return (
    <button
      className="w-16 h-16 border border-black flex items-center justify-center text-3xl text-black"
      onClick={onClick}
    >
      {value}
    </button>
  )
}

function Board({ xIsNext, squares, onPlay }) {
  function handleClick(i) {
    if (calculateWinner(squares) || squares[i]) return
    const next = squares.slice()
    next[i] = xIsNext ? 'X' : 'O'
    onPlay(next)
  }

  const winner = calculateWinner(squares)
  const isFull = squares.every((sq) => sq !== null)
  const status = winner
    ? 'Ganador: ' + winner
    : isFull
    ? 'Empate'
    : 'Turno de: ' + (xIsNext ? 'X' : 'O')

  return (
    <div className="text-black">
      <div className="mb-2 font-semibold">{status}</div>
      <div className="grid grid-cols-3">
        {squares.map((v, i) => (
          <Square key={i} value={v} onClick={() => handleClick(i)} />
        ))}
      </div>
    </div>
  )
}

export default function Game() {
  const [history, setHistory] = useState([Array(9).fill(null)])
  const [move, setMove] = useState(0)
  const xIsNext = move % 2 === 0
  const current = history[move]

  function handlePlay(next) {
    const newHist = [...history.slice(0, move + 1), next]
    setHistory(newHist)
    setMove(newHist.length - 1)
  }

  function jumpTo(m) {
    setMove(m)
  }

  const moves = history.map((_, m) => (
    <li key={m}>
      <button
        className="text-black hover:underline"
        onClick={() => jumpTo(m)}
      >
        {m ? 'Ir a mov ' + m : 'Inicio'}
      </button>
    </li>
  ))

  return (
    <main className="flex justify-start items-start min-h-screen p-4 bg-white text-black">
      <div className="text-right">
        <Board xIsNext={xIsNext} squares={current} onPlay={handlePlay} />
        <ol className="mt-2">{moves}</ol>
      </div>
    </main>
  )
}

function calculateWinner(sq) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ]
  for (let [a,b,c] of lines) {
    if (sq[a] && sq[a] === sq[b] && sq[a] === sq[c]) return sq[a]
  }
  return null
}