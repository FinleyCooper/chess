import Board from './Board'
import Move from './Move'
import Search from './Search'
import { StartingBoard, Pieces } from './constants'


export function getStartingPosition(humanFirst: boolean): Array<any> {
    if (humanFirst) {
        const board = new Board(StartingBoard, 0x000)
        const moveList = board.generateBinaryUCILegalMoves()
        return [board.toBinary(), Pieces.white, 0x000, moveList]
    }
    else {
        return calculateBestMove(StartingBoard, Pieces.white, 0x000)
    }
}

export function tryToPlayMove(from: number, to: number, binaryBoard: Uint8Array, sideToMove: number, boardData: number): Array<any> {
    const gameState = (boardData << 1) | +!(sideToMove === Pieces.white)

    let board = new Board(binaryBoard, gameState)

    board.playUCIMove(from, to)

    const moveList = board.generateBinaryUCILegalMoves()

    if (moveList.length === 0) {
        if (board.isCheck()) {
            console.log('Checkmate')
        }
        else {
            console.log('Stalemate')
        }
    }

    return [board.toBinary(), board.sideToMove, board.getBoardData(), moveList]
}

export function calculateBestMove(binaryBoard: Uint8Array, sideToMove: number, boardData: number): Array<any> {
    const gameState = (boardData << 1) | +!(sideToMove === Pieces.white)

    let board = new Board(binaryBoard, gameState)

    let bestMove: Move = Search(board, 4)

    board.playMove(bestMove)

    const moves2 = board.generateLegalMoves()

    if (moves2.length === 0) {
        if (board.isCheck()) {
            console.log('Checkmate')
        }
        else {
            console.log('Stalemate')
        }
    }

    const moveList = board.generateBinaryUCILegalMoves()

    return [board.toBinary(), board.sideToMove, board.getBoardData(), moveList]

} 