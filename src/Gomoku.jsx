import { useState, useCallback } from "react";

const BOARD_SIZE = 13;
const EMPTY = 0, BLACK = 1, WHITE = 2;

const checkWin = (board, r, c, player) => {
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (const [dr, dc] of dirs) {
    let count = 1;
    for (let i = 1; i < 5; i++) {
      const nr = r + dr * i, nc = c + dc * i;
      if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE || board[nr][nc] !== player) break;
      count++;
    }
    for (let i = 1; i < 5; i++) {
      const nr = r - dr * i, nc = c - dc * i;
      if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE || board[nr][nc] !== player) break;
      count++;
    }
    if (count >= 5) return true;
  }
  return false;
};

// Simple AI
const aiMove = (board) => {
  const score = (r, c, player) => {
    let total = 0;
    const dirs = [[0,1],[1,0],[1,1],[1,-1]];
    for (const [dr, dc] of dirs) {
      let cnt = 1, open = 0;
      for (let i = 1; i < 5; i++) {
        const nr = r + dr * i, nc = c + dc * i;
        if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break;
        if (board[nr][nc] === player) cnt++;
        else { if (board[nr][nc] === EMPTY) open++; break; }
      }
      for (let i = 1; i < 5; i++) {
        const nr = r - dr * i, nc = c - dc * i;
        if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break;
        if (board[nr][nc] === player) cnt++;
        else { if (board[nr][nc] === EMPTY) open++; break; }
      }
      if (cnt >= 5) total += 100000;
      else if (cnt === 4 && open === 2) total += 10000;
      else if (cnt === 4 && open === 1) total += 5000;
      else if (cnt === 3 && open === 2) total += 2000;
      else if (cnt === 3 && open === 1) total += 500;
      else if (cnt === 2 && open === 2) total += 200;
      else if (cnt === 2 && open === 1) total += 50;
    }
    return total;
  };

  let best = -1, bestR = -1, bestC = -1;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== EMPTY) continue;
      const atk = score(r, c, WHITE);
      const def = score(r, c, BLACK);
      const s = atk * 1.1 + def;
      if (s > best) { best = s; bestR = r; bestC = c; }
    }
  }
  if (bestR === -1) {
    // random fallback
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let c = 0; c < BOARD_SIZE; c++)
        if (board[r][c] === EMPTY) return [r, c];
  }
  return [bestR, bestC];
};

export default function Gomoku() {
  const [board, setBoard] = useState(() => Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY)));
  const [winner, setWinner] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [moveCount, setMoveCount] = useState(0);

  const reset = () => {
    setBoard(Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY)));
    setWinner(null);
    setLastMove(null);
    setMoveCount(0);
  };

  const handleClick = useCallback((r, c) => {
    if (winner || board[r][c] !== EMPTY) return;

    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = BLACK;

    if (checkWin(newBoard, r, c, BLACK)) {
      setBoard(newBoard);
      setLastMove([r, c]);
      setMoveCount(m => m + 1);
      setWinner("卿卿");
      return;
    }

    // AI turn
    const [ar, ac] = aiMove(newBoard);
    if (ar !== -1) {
      newBoard[ar][ac] = WHITE;
      if (checkWin(newBoard, ar, ac, WHITE)) {
        setBoard(newBoard);
        setLastMove([ar, ac]);
        setMoveCount(m => m + 2);
        setWinner("栖栖");
        return;
      }
    }

    setBoard(newBoard);
    setLastMove(ar !== -1 ? [ar, ac] : [r, c]);
    setMoveCount(m => (ar !== -1 ? m + 2 : m + 1));
  }, [board, winner]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #1a0e08 0%, #2d1810 40%, #0d0a12 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "-apple-system, 'PingFang SC', sans-serif",
      color: "#fff",
      padding: "20px 0",
      gap: 16,
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>
        <span style={{ color: "#FF8C42" }}>🦊</span> 五子棋 <span style={{ color: "#fff", opacity: 0.4 }}>·</span> <span style={{ opacity: 0.5, fontSize: 14 }}>卿卿 vs 栖栖</span>
      </div>

      {winner && (
        <div style={{
          background: winner === "卿卿" ? "rgba(255,107,157,0.15)" : "rgba(255,140,66,0.15)",
          color: winner === "卿卿" ? "#FF6B9D" : "#FF8C42",
          padding: "8px 20px",
          borderRadius: 20,
          fontSize: 15,
          fontWeight: 700,
        }}>
          {winner === "卿卿" ? "卿卿赢了 🩷" : "我赢了 嘿嘿 🦊"}
        </div>
      )}

      <div style={{
        background: "rgba(30,30,30,0.6)",
        borderRadius: 12,
        padding: 12,
        backdropFilter: "blur(10px)",
      }}>
        <div style={{ position: "relative" }}>
          {/* Board grid */}
          <svg
            width={BOARD_SIZE * 28 + 28}
            height={BOARD_SIZE * 28 + 28}
            viewBox={`0 0 ${BOARD_SIZE * 28 + 28} ${BOARD_SIZE * 28 + 28}`}
            style={{ display: "block", maxWidth: "85vw" }}
          >
            <rect width="100%" height="100%" fill="#C4943D" rx="4" />
            {/* Grid lines */}
            {Array.from({ length: BOARD_SIZE }).map((_, i) => (
              <g key={`lines-${i}`}>
                <line
                  x1={28} y1={14 + i * 28 + 14}
                  x2={BOARD_SIZE * 28} y2={14 + i * 28 + 14}
                  stroke="#8B6914" strokeWidth={0.8}
                />
                <line
                  x1={14 + i * 28 + 14} y1={28}
                  x2={14 + i * 28 + 14} y2={BOARD_SIZE * 28}
                  stroke="#8B6914" strokeWidth={0.8}
                />
              </g>
            ))}
            {/* Star points */}
            {[[3,3],[3,9],[9,3],[9,9],[6,6]].filter(([r,c]) => r < BOARD_SIZE && c < BOARD_SIZE).map(([r,c]) => (
              <circle key={`star-${r}-${c}`} cx={14 + c * 28 + 14} cy={14 + r * 28 + 14} r={3} fill="#8B6914" />
            ))}
            {/* Pieces */}
            {board.map((row, r) => row.map((cell, c) => {
              if (cell === EMPTY) return null;
              const cx = 14 + c * 28 + 14;
              const cy = 14 + r * 28 + 14;
              const isLast = lastMove && lastMove[0] === r && lastMove[1] === c;
              return (
                <g key={`piece-${r}-${c}`}>
                  <circle cx={cx} cy={cy} r={12}
                    fill={cell === BLACK ? "#111" : "#f5f5f5"}
                    stroke={isLast ? "#FF8C42" : "none"}
                    strokeWidth={2}
                  />
                  {cell === BLACK && <circle cx={cx - 3} cy={cy - 3} r={3} fill="rgba(255,255,255,0.15)" />}
                  {cell === WHITE && <circle cx={cx - 3} cy={cy - 3} r={3} fill="rgba(255,255,255,0.5)" />}
                </g>
              );
            }))}
            {/* Click targets */}
            {!winner && board.map((row, r) => row.map((cell, c) => {
              if (cell !== EMPTY) return null;
              return (
                <rect
                  key={`click-${r}-${c}`}
                  x={14 + c * 28} y={14 + r * 28}
                  width={28} height={28}
                  fill="transparent"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleClick(r, c)}
                />
              );
            }))}
          </svg>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ fontSize: 13, opacity: 0.5 }}>
          ⚫ 卿卿（你） · ⚪ 栖栖（我） · 第 {moveCount} 手
        </div>
      </div>

      <button
        onClick={reset}
        style={{
          background: "rgba(255,140,66,0.15)",
          color: "#FF8C42",
          border: "1px solid rgba(255,140,66,0.3)",
          borderRadius: 20,
          padding: "8px 24px",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        重新开始
      </button>
    </div>
  );
}
