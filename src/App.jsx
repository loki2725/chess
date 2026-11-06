import { useState, useEffect } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

export default function App() {
  const [game, setGame] = useState(new Chess());
  const [moveHistory, setMoveHistory] = useState([]);

  // Timer states
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const [timerActive, setTimerActive] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(600); // Default to 10m

  const timeUp = whiteTime === 0 || blackTime === 0;
  const gameOver = game.isGameOver() || timeUp;

  // Clock: ticks only for the side to move, stops when the game is over
  useEffect(() => {
    if (!timerActive || gameOver) return;

    const interval = setInterval(() => {
      if (game.turn() === "w") {
        setWhiteTime((prev) => Math.max(0, prev - 1));
      } else {
        setBlackTime((prev) => Math.max(0, prev - 1));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, gameOver, game]);

  // react-chessboard v5 passes a single object: { piece, sourceSquare, targetSquare }
  function onDrop({ sourceSquare, targetSquare }) {
    // Dropped off the board, or game already finished
    if (!targetSquare || gameOver) return false;

    try {
      // Clone the game by replaying history
      const gameCopy = new Chess();
      game.history().forEach((m) => gameCopy.move(m));

      // Attempt the new move (throws if illegal)
      gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q", // Automatically promote to queen
      });

      setGame(gameCopy);
      setMoveHistory(gameCopy.history());

      if (!timerActive) setTimerActive(true);
      return true;
    } catch {
      // Illegal move: snap the piece back
      return false;
    }
  }

  function resetGame(seconds) {
    setGame(new Chess());
    setMoveHistory([]);
    setWhiteTime(seconds);
    setBlackTime(seconds);
    setSelectedFormat(seconds);
    setTimerActive(false);
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }

  function getStatus() {
    if (whiteTime === 0) return "Black wins on time";
    if (blackTime === 0) return "White wins on time";
    if (game.isCheckmate()) {
      return `Checkmate - ${game.turn() === "w" ? "Black" : "White"} wins`;
    }
    if (game.isDraw()) return "Draw";
    if (game.isGameOver()) return "Game Over";
    return `${game.turn() === "w" ? "White" : "Black"} to move`;
  }

  return (
    <div className="min-h-screen bg-[#312e2b] text-[#ebecd0] font-sans flex flex-col md:flex-row items-center md:items-start justify-center p-4 md:p-8 gap-6 md:gap-10">
      {/* LEFT COLUMN: The Board */}
      <div className="w-full max-w-[600px] flex-shrink-0 flex flex-col gap-2">
        {/* Top Player (Black) */}
        <div className="flex justify-between items-center bg-[#262421] p-3 rounded-md shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#81b64c] text-white font-bold flex items-center justify-center rounded-sm">
              H
            </div>
            <span className="font-semibold text-lg">Hikaru</span>
          </div>
          <div
            className={`font-mono text-xl font-bold px-3 py-1 rounded bg-[#1e1c1a] ${
              blackTime < 60 ? "text-red-400" : "text-white"
            }`}
          >
            {formatTime(blackTime)}
          </div>
        </div>

        {/* The Chessboard */}
        <div className="w-full shadow-2xl rounded-sm overflow-hidden touch-none">
          <Chessboard
            options={{
              position: game.fen(),
              onPieceDrop: onDrop,
              darkSquareStyle: { backgroundColor: "#779556" },
              lightSquareStyle: { backgroundColor: "#ebecd0" },
              animationDurationInMs: 200,
            }}
          />
        </div>

        {/* Bottom Player (White) */}
        <div className="flex justify-between items-center bg-[#262421] p-3 rounded-md shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white text-[#262421] font-bold flex items-center justify-center rounded-sm">
              M
            </div>
            <span className="font-semibold text-lg">Magnus</span>
          </div>
          <div
            className={`font-mono text-xl font-bold px-3 py-1 rounded bg-[#1e1c1a] ${
              whiteTime < 60 ? "text-red-400" : "text-white"
            }`}
          >
            {formatTime(whiteTime)}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Controls & History */}
      <div className="w-full max-w-[600px] md:w-[350px] bg-[#262421] rounded-lg shadow-xl flex flex-col h-[600px]">
        {/* Header */}
        <div className="bg-[#1e1c1a] p-4 text-center border-b border-[#312e2b] rounded-t-lg">
          <h2 className="text-xl font-bold text-white">{getStatus()}</h2>
        </div>

        {/* Move History */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1 font-mono text-sm">
          {moveHistory.length === 0 ? (
            <div className="text-center text-gray-500 italic mt-10">
              No moves played yet.
            </div>
          ) : (
            Array.from({ length: Math.ceil(moveHistory.length / 2) }).map(
              (_, i) => (
                <div
                  key={i}
                  className={`flex py-1 px-2 rounded ${
                    i % 2 === 0 ? "bg-[#312e2b]" : ""
                  }`}
                >
                  <span className="w-8 text-gray-500">{i + 1}.</span>
                  <span className="flex-1 text-white font-semibold">
                    {moveHistory[i * 2]}
                  </span>
                  <span className="flex-1 text-white font-semibold">
                    {moveHistory[i * 2 + 1] || ""}
                  </span>
                </div>
              ),
            )
          )}
        </div>

        {/* Controls */}
        <div className="p-4 bg-[#1e1c1a] rounded-b-lg border-t border-[#312e2b] flex flex-col gap-4">
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => resetGame(180)}
              className={`px-4 py-2 rounded font-bold text-sm transition-colors ${
                selectedFormat === 180
                  ? "bg-[#4b4847] text-white"
                  : "bg-[#312e2b] text-gray-400 hover:bg-[#4b4847]"
              }`}
            >
              Blitz 3m
            </button>
            <button
              onClick={() => resetGame(300)}
              className={`px-4 py-2 rounded font-bold text-sm transition-colors ${
                selectedFormat === 300
                  ? "bg-[#4b4847] text-white"
                  : "bg-[#312e2b] text-gray-400 hover:bg-[#4b4847]"
              }`}
            >
              Blitz 5m
            </button>
            <button
              onClick={() => resetGame(600)}
              className={`px-4 py-2 rounded font-bold text-sm transition-colors ${
                selectedFormat === 600
                  ? "bg-[#4b4847] text-white"
                  : "bg-[#312e2b] text-gray-400 hover:bg-[#4b4847]"
              }`}
            >
              Rapid 10m
            </button>
          </div>

          <button
            onClick={() => resetGame(selectedFormat)}
            className="w-full bg-[#81b64c] hover:bg-[#a3d160] text-white font-bold py-4 rounded-lg shadow-md transition-colors text-lg"
          >
            New Game
          </button>
        </div>
      </div>
    </div>
  );
}
