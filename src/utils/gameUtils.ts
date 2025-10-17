import { PieceData } from "@/hooks/useGameLogic";
import { BASE_MINI_APP_CONSTANTS } from "@/lib/minikit.config";

const { GRID_SIZE } = BASE_MINI_APP_CONSTANTS;

export const pieceTemplates: number[][][] = [
  [[1, 1]],
  [[1], [1]],
  [[1, 1, 1]],
  [[1], [1], [1]],
  [[1, 1, 1, 1]],
  [[1], [1], [1], [1]],
  [
    [1, 1],
    [1, 1],
  ],
  [
    [1, 1],
    [1, 0],
  ],
  [
    [1, 0],
    [1, 1],
  ],
  [
    [0, 1],
    [1, 1],
  ],
  [
    [1, 1],
    [0, 1],
  ],
  [
    [1, 1, 1],
    [1, 0, 0],
  ],
  [
    [1, 1, 1],
    [0, 0, 1],
  ],
  [
    [1, 0, 0],
    [1, 1, 1],
  ],
  [
    [0, 0, 1],
    [1, 1, 1],
  ],
  [
    [1, 1, 1],
    [0, 1, 0],
  ],
  [
    [0, 1, 0],
    [1, 1, 1],
  ],
  [
    [1, 0],
    [1, 1],
    [1, 0],
  ],
  [
    [0, 1],
    [1, 1],
    [0, 1],
  ],
  [
    [1, 1, 0],
    [0, 1, 1],
  ],
  [
    [0, 1, 1],
    [1, 1, 0],
  ],
  [
    [1, 0],
    [1, 1],
    [0, 1],
  ],
  [
    [0, 1],
    [1, 1],
    [1, 0],
  ],
  [
    [1, 1, 1],
    [1, 0, 0],
    [1, 0, 0],
  ],
  [
    [1, 1, 1],
    [0, 0, 1],
    [0, 0, 1],
  ],
  [
    [1, 0, 0],
    [1, 0, 0],
    [1, 1, 1],
  ],
  [
    [0, 0, 1],
    [0, 0, 1],
    [1, 1, 1],
  ],
  [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1],
  ],
  [
    [1, 1, 1],
    [1, 1, 1],
  ],
  [
    [1, 1],
    [1, 1],
    [1, 1],
  ],
];

export const colors: string[] = [
  "filled-purple",
  "filled-pink",
  "filled-blue",
  "filled-orange",
];

/* ============================================
   BOUNDING BOX CALCULATION
   ============================================ */
export const calculatePieceBoundingBox = (
  piece: number[][]
): { minRow: number; maxRow: number; minCol: number; maxCol: number } => {
  if (!piece || piece.length === 0) {
    return { minRow: 0, maxRow: 0, minCol: 0, maxCol: 0 };
  }

  let minRow = Infinity;
  let maxRow = -Infinity;
  let minCol = Infinity;
  let maxCol = -Infinity;

  for (let r = 0; r < piece.length; r++) {
    for (let c = 0; c < piece[r].length; c++) {
      if (piece[r][c] === 1) {
        minRow = Math.min(minRow, r);
        maxRow = Math.max(maxRow, r);
        minCol = Math.min(minCol, c);
        maxCol = Math.max(maxCol, c);
      }
    }
  }

  if (minRow === Infinity) {
    return { minRow: 0, maxRow: 0, minCol: 0, maxCol: 0 };
  }

  return { minRow, maxRow, minCol, maxCol };
};

export const calculatePieceEdgeOffset = (
  piece: number[][],
  cellSize: number
): { offsetX: number; offsetY: number } => {
  if (!piece || piece.length === 0) {
    return { offsetX: 0, offsetY: 0 };
  }

  const pieceHeight = piece.length;
  const pieceWidth = piece[0]?.length || 0;

  const bbox = calculatePieceBoundingBox(piece);

  const templateCenterY = (pieceHeight - 1) / 2;
  const templateCenterX = (pieceWidth - 1) / 2;

  const filledCenterY = (bbox.minRow + bbox.maxRow) / 2;
  const filledCenterX = (bbox.minCol + bbox.maxCol) / 2;

  const offsetY = (filledCenterY - templateCenterY) * cellSize;
  const offsetX = (filledCenterX - templateCenterX) * cellSize;

  return { offsetX: -offsetX, offsetY: -offsetY };
};

export const canPlacePiece = (
  piece: number[][],
  startRow: number,
  startCol: number,
  gameGrid: (string | null)[][]
): boolean => {
  if (!piece || !gameGrid || piece.length === 0 || !piece[0]) {
    return false;
  }

  const pieceHeight = piece.length;
  const pieceWidth = piece[0].length;

  if (
    startRow < 0 ||
    startCol < 0 ||
    startRow + pieceHeight > GRID_SIZE ||
    startCol + pieceWidth > GRID_SIZE
  ) {
    return false;
  }

  for (let r = 0; r < pieceHeight; r++) {
    const pieceRow = piece[r];
    if (!pieceRow) continue;

    for (let c = 0; c < pieceWidth; c++) {
      if (pieceRow[c] !== 1) continue;

      const targetRow = startRow + r;
      const targetCol = startCol + c;

      const gridRow = gameGrid[targetRow];
      if (!gridRow) return false;

      if (gridRow[targetCol] !== null) {
        return false;
      }
    }
  }

  return true;
};

export const findNearestSnapPosition = (
  piece: number[][],
  targetRow: number,
  targetCol: number,
  gameGrid: (string | null)[][],
  snapRadius: number = 2
): { row: number; col: number; distance: number } | null => {
  if (canPlacePiece(piece, targetRow, targetCol, gameGrid)) {
    return { row: targetRow, col: targetCol, distance: 0 };
  }

  let bestPosition: { row: number; col: number; distance: number } | null =
    null;
  let minDistance = Infinity;

  for (let radius = 1; radius <= snapRadius; radius++) {
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        if (Math.abs(dr) !== radius && Math.abs(dc) !== radius) continue;

        const newRow = targetRow + dr;
        const newCol = targetCol + dc;

        if (canPlacePiece(piece, newRow, newCol, gameGrid)) {
          const distance = Math.sqrt(dr * dr + dc * dc);
          if (distance < minDistance) {
            minDistance = distance;
            bestPosition = { row: newRow, col: newCol, distance };
          }
        }
      }
    }

    if (bestPosition) {
      return bestPosition;
    }
  }

  return null;
};

export const checkAndClearLines = (
  grid: (string | null)[][]
): {
  newGrid: (string | null)[][];
  cellsCleared: { row: number; col: number }[];
  linesCleared: number;
  scoreEarned: number;
  clearedRows: number[];
  clearedCols: number[];
} => {
  const cellsToClear: { row: number; col: number }[] = [];
  const markedCells = new Set<string>();
  const clearedRows: number[] = [];
  const clearedCols: number[] = [];

  for (let row = 0; row < GRID_SIZE; row++) {
    if (grid[row] && grid[row].every((cell) => cell !== null)) {
      clearedRows.push(row);
      for (let col = 0; col < GRID_SIZE; col++) {
        const key = `${row},${col}`;
        if (!markedCells.has(key)) {
          cellsToClear.push({ row, col });
          markedCells.add(key);
        }
      }
    }
  }

  for (let col = 0; col < GRID_SIZE; col++) {
    let isFullColumn = true;
    for (let row = 0; row < GRID_SIZE; row++) {
      if (!grid[row] || grid[row][col] === null) {
        isFullColumn = false;
        break;
      }
    }

    if (isFullColumn) {
      clearedCols.push(col);
      for (let row = 0; row < GRID_SIZE; row++) {
        const key = `${row},${col}`;
        if (!markedCells.has(key)) {
          cellsToClear.push({ row, col });
          markedCells.add(key);
        }
      }
    }
  }

  const scoreEarned = cellsToClear.length * 10;
  const linesCleared = clearedRows.length + clearedCols.length;

  const newGrid = grid.map((row) => [...row]);
  cellsToClear.forEach(({ row, col }) => {
    newGrid[row][col] = null;
  });

  return {
    newGrid,
    cellsCleared: cellsToClear,
    linesCleared,
    scoreEarned,
    clearedRows,
    clearedCols,
  };
};

export const generateNewPieces = (): PieceData[] => {
  const pieces: PieceData[] = [];
  const usedTemplates = new Set<number>();

  const smallPieces: number[] = [];
  const mediumPieces: number[] = [];
  const largePieces: number[] = [];

  pieceTemplates.forEach((template, index) => {
    let cellCount = 0;
    for (let row of template) {
      for (let cell of row) {
        if (cell === 1) cellCount++;
      }
    }

    if (cellCount <= 3) {
      smallPieces.push(index);
    } else if (cellCount <= 6) {
      mediumPieces.push(index);
    } else {
      largePieces.push(index);
    }
  });

  let hasVertical = false;
  let hasHorizontal = false;
  let hasComplex = false;
  let hasLarge = false;

  for (let i = 0; i < 3; i++) {
    let attempts = 0;
    let selectedIndex = -1;

    do {
      let categoryPool: number[];

      if (i === 0) {
        categoryPool =
          Math.random() < 0.7
            ? mediumPieces
            : [...mediumPieces, ...largePieces];
      } else if (i === 1) {
        if (hasLarge) {
          categoryPool = [...smallPieces, ...mediumPieces];
        } else {
          categoryPool =
            Math.random() < 0.6
              ? mediumPieces
              : [...mediumPieces, ...largePieces];
        }
      } else {
        if (hasLarge) {
          categoryPool = smallPieces;
        } else {
          categoryPool = [...smallPieces, ...mediumPieces];
        }
      }

      if (categoryPool.length === 0) {
        categoryPool = [...smallPieces, ...mediumPieces];
      }

      selectedIndex =
        categoryPool[Math.floor(Math.random() * categoryPool.length)];
      attempts++;

      if (usedTemplates.has(selectedIndex)) {
        selectedIndex = -1;
        continue;
      }

      const template = pieceTemplates[selectedIndex];
      const height = template.length;
      const width = template[0]?.length || 0;

      let cellCount = 0;
      for (let row of template) {
        for (let cell of row) {
          if (cell === 1) cellCount++;
        }
      }

      if (i >= 1) {
        const isVertical = height > width;
        const isHorizontal = width > height;
        const isComplex = height > 1 && width > 1;
        const isLarge = cellCount >= 7;

        if (hasLarge && isLarge && attempts < 5) {
          selectedIndex = -1;
          continue;
        }

        if (hasVertical && isHorizontal && attempts < 3) break;
        if (hasHorizontal && isVertical && attempts < 3) break;
        if (!hasComplex && isComplex && attempts < 3) break;
      }

      break;
    } while (attempts < 20);

    if (selectedIndex === -1 || usedTemplates.has(selectedIndex)) {
      const available = pieceTemplates
        .map((_, idx) => idx)
        .filter((idx) => !usedTemplates.has(idx));

      if (available.length > 0) {
        selectedIndex = available[Math.floor(Math.random() * available.length)];
      } else {
        selectedIndex = Math.floor(Math.random() * pieceTemplates.length);
      }
    }

    usedTemplates.add(selectedIndex);

    const template = pieceTemplates[selectedIndex];
    const height = template.length;
    const width = template[0]?.length || 0;

    let cellCount = 0;
    for (let row of template) {
      for (let cell of row) {
        if (cell === 1) cellCount++;
      }
    }

    if (height > width) hasVertical = true;
    if (width > height) hasHorizontal = true;
    if (height > 1 && width > 1) hasComplex = true;
    if (cellCount >= 7) hasLarge = true;

    pieces.push({
      template: template.map((row) => [...row]),
      used: false,
    });
  }

  return pieces.sort(() => Math.random() - 0.5);
};

// ✅ FIXED: Game over detection dengan logging
export const isGameOver = (
  pieces: PieceData[],
  gameGrid: (string | null)[][]
): boolean => {
  if (!pieces || !gameGrid) {
    console.log("[GAME OVER CHECK] ⚠️ Invalid input - pieces or grid is null");
    return false;
  }

  const unusedPieces = pieces.filter((p) => p && !p.used);

  console.log(
    "[GAME OVER CHECK] 🔍 Checking",
    unusedPieces.length,
    "unused pieces"
  );

  if (unusedPieces.length === 0) {
    console.log(
      "[GAME OVER CHECK] ⏳ No unused pieces - waiting for new generation"
    );
    return false;
  }

  // Check if ANY piece can be placed ANYWHERE on the grid
  for (let pieceIndex = 0; pieceIndex < unusedPieces.length; pieceIndex++) {
    const piece = unusedPieces[pieceIndex];

    if (!piece || !piece.template) {
      console.log("[GAME OVER CHECK] ⚠️ Piece", pieceIndex, "has no template");
      continue;
    }

    // Try EVERY position on the grid
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (canPlacePiece(piece.template, row, col, gameGrid)) {
          console.log(
            "[GAME OVER CHECK] ✅ Found valid move for piece",
            pieceIndex,
            "at position [",
            row,
            ",",
            col,
            "]"
          );
          return false; // Found at least ONE valid move
        }
      }
    }
  }

  console.log("[GAME OVER CHECK] ❌ NO VALID MOVES FOUND - GAME OVER!");
  return true;
};

export const hasValidMoves = (
  pieces: PieceData[],
  gameGrid: (string | null)[][]
): boolean => {
  return !isGameOver(pieces, gameGrid);
};

export const findMostBlockingLine = (
  grid: (string | null)[][]
): { type: "row" | "col"; index: number; count: number } | null => {
  let maxCount = 0;
  let bestLine: { type: "row" | "col"; index: number; count: number } | null =
    null;

  for (let row = 0; row < GRID_SIZE; row++) {
    const count = grid[row].filter((cell) => cell !== null).length;
    if (count > maxCount && count < GRID_SIZE) {
      maxCount = count;
      bestLine = { type: "row", index: row, count };
    }
  }

  for (let col = 0; col < GRID_SIZE; col++) {
    let count = 0;
    for (let row = 0; row < GRID_SIZE; row++) {
      if (grid[row][col] !== null) count++;
    }
    if (count > maxCount && count < GRID_SIZE) {
      maxCount = count;
      bestLine = { type: "col", index: col, count };
    }
  }

  return bestLine;
};

export const clearMostBlockingLine = (
  grid: (string | null)[][]
): (string | null)[][] => {
  const blockingLine = findMostBlockingLine(grid);

  if (!blockingLine) {
    return grid.map((row) => [...row]);
  }

  const newGrid = grid.map((row) => [...row]);

  if (blockingLine.type === "row") {
    for (let col = 0; col < GRID_SIZE; col++) {
      newGrid[blockingLine.index][col] = null;
    }
  } else {
    for (let row = 0; row < GRID_SIZE; row++) {
      newGrid[row][blockingLine.index] = null;
    }
  }

  return newGrid;
};

export const calculateComboBonus = (
  comboStreak: number,
  baseScore: number
): number => {
  if (comboStreak === 0) return 0;
  const multiplier = Math.min(comboStreak + 1, 10);
  return baseScore * (multiplier - 1);
};

export const getPieceDimensions = (
  piece: number[][]
): { width: number; height: number } => {
  if (!piece || piece.length === 0) {
    return { width: 0, height: 0 };
  }
  const height = piece.length;
  const width = piece[0] ? piece[0].length : 0;
  return { width, height };
};

export const rotatePiece = (piece: number[][]): number[][] => {
  if (!piece || piece.length === 0) return piece;
  const rows = piece.length;
  const cols = piece[0].length;
  const rotated: number[][] = [];

  for (let c = 0; c < cols; c++) {
    rotated[c] = [];
    for (let r = rows - 1; r >= 0; r--) {
      rotated[c][rows - 1 - r] = piece[r][c];
    }
  }
  return rotated;
};

export const calculatePlacementScore = (piece: number[][]): number => {
  if (!piece) return 0;
  let cellCount = 0;
  for (let r = 0; r < piece.length; r++) {
    if (piece[r]) {
      for (let c = 0; c < piece[r].length; c++) {
        if (piece[r][c] === 1) {
          cellCount++;
        }
      }
    }
  }
  return cellCount * 10;
};

export const isValidGrid = (grid: (string | null)[][]): boolean => {
  if (!grid || grid.length !== GRID_SIZE) {
    return false;
  }
  for (let r = 0; r < GRID_SIZE; r++) {
    if (!grid[r] || grid[r].length !== GRID_SIZE) {
      return false;
    }
  }
  return true;
};

export const getSafeGridPosition = (
  piece: number[][],
  targetRow: number,
  targetCol: number
): { row: number; col: number } => {
  if (!piece || piece.length === 0) {
    return { row: targetRow, col: targetCol };
  }

  const pieceHeight = piece.length;
  const pieceWidth = piece[0]?.length || 0;

  const safeRow = Math.max(0, Math.min(targetRow, GRID_SIZE - pieceHeight));
  const safeCol = Math.max(0, Math.min(targetCol, GRID_SIZE - pieceWidth));

  return { row: safeRow, col: safeCol };
};

export const getPieceOrientationClass = (piece: number[][]): string => {
  if (!piece || piece.length === 0) return "";

  const height = piece.length;
  const width = piece[0]?.length || 0;

  if (height === 4 && width === 1) return "piece-vertical-4";
  if (height === 3 && width === 1) return "piece-vertical-3";
  if (height === 1 && width === 4) return "piece-horizontal-4";
  if (height === 1 && width === 3) return "piece-horizontal-3";

  return height > width ? "piece-vertical" : "piece-horizontal";
};

export const isVerticalPiece = (piece: number[][]): boolean => {
  if (!piece || piece.length === 0) return false;
  const height = piece.length;
  const width = piece[0]?.length || 0;
  return height > width;
};
