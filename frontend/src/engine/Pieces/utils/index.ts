import Board from "../../Board"
import Move from "../../Move"
import SquareCollection from "../../SquareCollection"
import { Pieces } from "../../constants"
import { precomputedSlidersSeralisedDistances } from "./precalculations/results"

export function getSlidingPieceAttacks(square: number, offsets: Array<number>, blockers: bigint, distance: number = 8) {
    const allOffsets = [-1, 7, 8, 9, 1, -7, -8, -9]

    let distancesFromEdge = precomputedSlidersSeralisedDistances.get(square)

    if (!distancesFromEdge) {
        throw 'Error using precomputed slider data'
    }

    let attackBitboard = 0n

    distancesFromEdge = distancesFromEdge.filter((_, i) => offsets.includes(allOffsets[i]))

    for (let i = 0; i < offsets.length; i++) {
        for (let j = 0; j < Math.min(distancesFromEdge[i], distance); j++) {
            const destSquareBitboardValue = 1n << BigInt((offsets[i] * (j + 1)) + square)

            attackBitboard |= destSquareBitboardValue

            // If we've run into a piece, we stop counting attacks on this offset
            if (blockers & destSquareBitboardValue) {
                break
            }
        }
    }

    return attackBitboard
}

export function generateSliderMoves(square: number, pieceColour: number, offsets: Array<number>, board: Board, distance: number = 8) {
    const pieceColourIndex = pieceColour == Pieces.white ? 0 : 1

    const opponentPieces = board.collections[Pieces.all][1 - pieceColourIndex]
    const friendlyPieces = board.collections[Pieces.all][pieceColourIndex]

    const attacks = getSlidingPieceAttacks(square, offsets, opponentPieces.or(friendlyPieces).bitboard, distance)

    let moves: Array<Move> = []

    // Captures
    const captures = attacks & opponentPieces.bitboard

    for (const captureSquare of new SquareCollection(captures)) {
        moves.push(Move.fromCharacteristics(captureSquare, square, true))
    }

    // Quiet Moves
    const quietMoves = attacks & (opponentPieces.or(friendlyPieces).not()).bitboard

    for (const quietMove of new SquareCollection(quietMoves)) {
        moves.push(Move.fromCharacteristics(quietMove, square))
    }

    return moves
}