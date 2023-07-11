import Board from './Board'
import MoveGenerator from './MoveGenerator'
import { StartingBoard, Pieces } from './constants'


export function getStartingPosition(): Array<any> {
    const board = new Board(StartingBoard, 0x000)
    const generator = new MoveGenerator(board)
    const moveList = generator.generateBinaryUCILegalMoves()

    return [StartingBoard, Pieces.white, 0x000, moveList]
}

export function tryToPlayMove(from: number, to: number, binaryBoard: Uint8Array, sideToMove: number, boardData: number, TESTING_REVERSEMOVES: boolean): Array<any> {
    const gameState = (boardData << 1) | +!(sideToMove === Pieces.white)

    let board = new Board(binaryBoard, gameState)

    board.playUCIMove(from, to)


    const generator = new MoveGenerator(board)
    const moveList = generator.generateBinaryUCILegalMoves()

    if (moveList.length === 0) {
        if (generator.isCheck()) {
            console.log('Checkmate')
        }
        else {
            console.log('Stalemate')
        }
    }

    return [board.boardList, board.sideToMove, board.getBoardData(), moveList]
}