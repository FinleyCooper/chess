import Board from "./Board";
import Evaluation from "./Evaluation";
import Move from "./Move";
import { Pieces } from "./constants";
import { pieceValue } from "./Evaluation";


function sortMoves(board: Board, moves: Array<Move>) {
    // Length of move array is usually around 30 per position so insertion sort is the choice for optimisation
    const moveGoodnessArray = moves.map(move => getEstimatedMoveGoodness(board, move))
    const newOrder = Array(moves.length)

    for (let i = 0; i < newOrder.length; i++) {
        newOrder[i] = i
    }

    let i = 0

    while (i < moves.length) {
        let j = i
        while (j > 0 && moveGoodnessArray[j - 1] > moveGoodnessArray[j]) {
            [newOrder[j], newOrder[j - 1]] = [newOrder[j - 1], newOrder[j]];
            [moveGoodnessArray[j], moveGoodnessArray[j - 1]] = [moveGoodnessArray[j - 1], moveGoodnessArray[j]];

            j -= 1
        }
        i += 1
    }

    return newOrder.reverse()
}

function getEstimatedMoveGoodness(board: Board, move: Move) {
    let estimatedMoveGoodness = 0

    const destinationPiece = board.square[move.getDestinationSquare()]
    const sourcePiece = board.square[move.getSourceSquare()]

    // Capture difference
    estimatedMoveGoodness += Math.min(pieceValue[destinationPiece.getType()] - pieceValue[sourcePiece.getType()], 0)

    if (move.getFlag() & 0b1000) {
        estimatedMoveGoodness += pieceValue[move.getPromotionPiece()]
    }
    if (move.isCapture()) {
        estimatedMoveGoodness += 1000
    }

    return estimatedMoveGoodness
}

function simplifyPosition(board: Board, alpha: number, beta: number) {
    const evaluation = Evaluation(board)

    if (evaluation >= beta) {
        return beta
    }
    if (evaluation > alpha) {
        alpha = evaluation
    }

    const captures = board.generateLegalMoves().filter(move => move.isCapture())

    const estimatedMoveOrder = sortMoves(board, captures)

    for (let i = 0; i < captures.length; i++) {
        board.playMove(captures[estimatedMoveOrder[i]])
        const evaluation = -simplifyPosition(board, -beta, -alpha)
        board.unplayMove(captures[estimatedMoveOrder[i]])

        if (evaluation >= beta) {
            return beta
        }
        if (evaluation > alpha) {
            alpha = evaluation
        }
    }

    return alpha
}

function search(board: Board, depth: number) {
    let bestMove = new Move(0)
    const maxDepth = depth

    function searchDepth(board: Board, depth: number, alpha: number, beta: number) {
        if (depth == 0) {
            return simplifyPosition(board, alpha, beta)
        }

        const moves = board.generateLegalMoves()

        if (moves.length === 0) {
            if (board.isCheck()) {
                return -Infinity
            }
            return 0
        }

        const estimatedMoveOrder = sortMoves(board, moves)


        for (let i = 0; i < moves.length; i++) {
            board.playMove(moves[estimatedMoveOrder[i]])
            const evaluation = -searchDepth(board, depth - 1, -beta, -alpha)
            board.unplayMove(moves[estimatedMoveOrder[i]])

            if (evaluation >= beta) {
                if (depth === maxDepth) {
                    bestMove = moves[estimatedMoveOrder[i]]
                }
                return beta
            }

            if (evaluation > alpha) {
                if (depth === maxDepth) {
                    bestMove = moves[estimatedMoveOrder[i]]
                }
                alpha = evaluation
            }
        }

        return alpha
    }

    searchDepth(board, maxDepth, -Infinity, Infinity)
    return bestMove
}

function searchDepth(board: Board, depth: number, alpha: number, beta: number) {
    if (depth == 0) {
        return simplifyPosition(board, alpha, beta)
    }

    const moves = board.generateLegalMoves()

    if (moves.length === 0) {
        if (board.isCheck()) {
            return -Infinity
        }
        return 0
    }

    const estimatedMoveOrder = sortMoves(board, moves)


    for (let i = 0; i < moves.length; i++) {
        board.playMove(moves[estimatedMoveOrder[i]])
        const evaluation = -searchDepth(board, depth - 1, -beta, -alpha)
        board.unplayMove(moves[estimatedMoveOrder[i]])

        if (evaluation >= beta) {
            return beta
        }

        if (evaluation > alpha) {
            alpha = evaluation
        }
    }

    return alpha
}

export default search