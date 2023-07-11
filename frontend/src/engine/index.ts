import Board from './Board'
import { StartingBoard, Pieces } from './constants'


export function getStartingPosition(): Array<any> {
    const board = new Board(StartingBoard, 0x000)
    const moveList = board.generateBinaryUCILegalMoves()

    return [board.toBinary(), Pieces.white, 0x000, moveList]
}

export function tryToPlayMove(from: number, to: number, binaryBoard: Uint8Array, sideToMove: number, boardData: number, TESTING_REVERSEMOVES: boolean): Array<any> {
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