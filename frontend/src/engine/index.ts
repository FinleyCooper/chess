import Board from './Board'
import Move from './Move'
import Search from './Search'
import { StartingBoard, Pieces } from './constants'


export function getStartingPosition(humanPlaysAs: number = Pieces.white): Array<any> {
    if (humanPlaysAs === Pieces.white) {
        const board = new Board(StartingBoard, 0x000)
        const moveList = board.generateBinaryUCILegalMoves()
        return [board.toBinary(), Pieces.white, 0x000, moveList, false, []]
    }
    else {
        return calculateBestMove(StartingBoard, Pieces.white, 0x000)
    }
}

function decimalToCordinate(square: number) {
    return `${String.fromCharCode(97 + (square % 8))}${Math.floor(square / 8) + 1}`
}

export function tryToPlayMove(from: number, to: number, binaryBoard: Uint8Array, sideToMove: number, boardData: number): Array<any> {
    const gameState = (boardData << 1) | +!(sideToMove === Pieces.white)

    let board = new Board(binaryBoard, gameState)

    board.playUCIMove(from, to)

    const moveList = board.generateBinaryUCILegalMoves()

    return [board.toBinary(), board.sideToMove, board.getBoardData(), moveList, board.isCheck(), `${decimalToCordinate(from)}${decimalToCordinate(to)}`]
}

export function calculateBestMove(binaryBoard: Uint8Array, sideToMove: number, boardData: number): Array<any> {
    const gameState = (boardData << 1) | +!(sideToMove === Pieces.white)

    let board = new Board(binaryBoard, gameState)

    let bestMove: Move = Search(board, 3)

    board.playMove(bestMove)

    const moveList = board.generateBinaryUCILegalMoves()

    return [board.toBinary(), board.sideToMove, board.getBoardData(), moveList, board.isCheck(), `${decimalToCordinate(bestMove.getSourceSquare())}${decimalToCordinate(bestMove.getDestinationSquare())}`]

} 