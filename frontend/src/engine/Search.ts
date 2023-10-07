import Board from "./Board";
import Evaluation from "./Evaluation";
import Move from "./Move";
import { pieceValue } from "./Evaluation";
import { Customisation, defaultCustomisation } from "./Engine";
import { PieceSquareTable } from "./Engine";

function sortMoves(board: Board, moves: Array<Move>) {
    // Length of move array is usually around 30 per position so insertion sort is the choice for optimisation
    // We sort the moveGoodnessArray and the newOrder at the same time so we can just return the indexes of the moves which should be looked at first
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

    const destinationPiece = board.getSquares()[move.getDestinationSquare()]
    const sourcePiece = board.getSquares()[move.getSourceSquare()]

    // Capture difference
    estimatedMoveGoodness += Math.max(pieceValue[destinationPiece.getType()] - pieceValue[sourcePiece.getType()], 0)

    if (move.getFlag() & 0b1000) {
        estimatedMoveGoodness += pieceValue[move.getPromotionPiece()]
    }
    if (move.isCapture()) {
        estimatedMoveGoodness += 500
    }

    return estimatedMoveGoodness
}

function simplifyPosition(board: Board, alpha: number, beta: number, customisation: Customisation, pieceSquareTables: PieceSquareTable) {
    const evaluation = Evaluation(board, customisation, pieceSquareTables)

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
        const evaluation = -simplifyPosition(board, -beta, -alpha, customisation, pieceSquareTables)
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

function search(board: Board, customisation: Customisation = defaultCustomisation, pieceSquareTables: PieceSquareTable) {
    let bestMove = new Move(0) // Dummy move
    const maxDepth = customisation.depth
    const checkmateEval = -99999999999

    function searchDepth(board: Board, depth: number, alpha: number, beta: number) {
        if (depth == 0) {
            return simplifyPosition(board, alpha, beta, customisation, pieceSquareTables)
        }

        const moves = board.generateLegalMoves()

        if (moves.length === 0) {
            if (board.isCheck()) {
                return checkmateEval + depth // Checkmate
            }
            return 0 // Stalemate
        }

        let seenMoves = moves.filter(_ => {
            return Math.random() * 100 > customisation.blindSpots * (1 + ((depth - 1) / maxDepth))
        })

        let estimatedMoveOrder: Array<number>

        if (seenMoves.length === 0) {
            estimatedMoveOrder = [0]
            seenMoves = [moves[0]]
        }
        else {
            estimatedMoveOrder = sortMoves(board, seenMoves)
        }


        for (let i = 0; i < estimatedMoveOrder.length; i++) {
            const move = seenMoves[estimatedMoveOrder[i]]
            board.playMove(move)

            let evaluation;

            if (board.hasPositionOccurredBefore() && depth < maxDepth) {
                board.unplayMove(move)
                return 0 // Cut the branch as a draw
            }
            else {
                evaluation = -searchDepth(board, depth - 1, -beta, -alpha)
            }

            board.unplayMove(move)

            if (evaluation >= beta) {
                if (depth === maxDepth) {
                    bestMove = move
                }
                // Cut this branch. This branch is now a leaf. The move before was too good, so our opponent will never get to this postion.
                return beta
            }

            if (evaluation > alpha) {
                if (depth === maxDepth) {
                    bestMove = move
                }
                alpha = evaluation
            }
        }

        return alpha
    }

    searchDepth(board, maxDepth, -Infinity, Infinity)

    if (bestMove.datum === 0) { // Check if it is still the dummy move
        throw new Error("Move calculated was invalid!")
    }

    return bestMove
}

export default search