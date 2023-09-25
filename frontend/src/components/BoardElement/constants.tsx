interface BoardCustomisation {
    lightSquares: string
    darkSquares: string
    activeSquare: string
    allowedMove: string
    lastMoveDestination: string
    lastMoveSource: string
}

export const squareLength: number = 100 // Pixels

export const initialColours: BoardCustomisation = {
    lightSquares: "#f0d9b5",
    darkSquares: "#b58863",
    activeSquare: "#ffffff",
    allowedMove: "#000",
    lastMoveDestination: "#ffdd47",
    lastMoveSource: "#ffeb94"
}

export const Pieces = {
    empty: 0,
    pawn: 1,
    rook: 2,
    knight: 3,
    bishop: 4,
    queen: 5,
    king: 6,
    black: 8,
    white: 16
}

