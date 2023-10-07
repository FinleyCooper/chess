import BasePiece from "./BasePiece";
import { Pieces } from "../constants";
import Board from "../Board";
import Move from "../Move";
import { precomputedKnightMoves } from "./utils/precalculations/results";
import SquareCollection from "../SquareCollection";


class Knight extends BasePiece {
    constructor(colour: number) {
        super(colour | Pieces.knight)
    }

    public override getAttacks(square: number, blockers: bigint) {
        const squaresInRange = precomputedKnightMoves.get(square)

        if (!squaresInRange) {
            throw 'Error using precomputed knight data'
        }

        let attackBitboard = 0n


        for (const destSquare of squaresInRange) {
            attackBitboard |= 1n << BigInt(destSquare)
        }

        return attackBitboard
    }

    public override getLegalMoves(square: number, board: Board): Array<Move> {
        let moves: Array<Move> = []

        const pieceColour = this.getColour()

        const attacks = new SquareCollection(this.getAttacks(square, 0n))

        const pieceColourIndex = pieceColour == Pieces.white ? 0 : 1

        const opponentPieces = board.getCollections()[Pieces.all][1 - pieceColourIndex]
        const friendlyPieces = board.getCollections()[Pieces.all][pieceColourIndex]

        // Captures
        const captures = attacks.and(opponentPieces)

        for (const captureSquare of captures) {
            moves.push(Move.fromCharacteristics(captureSquare, square, true))
        }

        // Quiet Moves
        const quietMoves = attacks.and(opponentPieces.or(friendlyPieces).not())

        for (const quietMove of quietMoves) {
            moves.push(Move.fromCharacteristics(quietMove, square))
        }

        return moves
    }
}

export default Knight