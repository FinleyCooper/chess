import BasePiece from "./BasePiece";
import { Pieces } from "../constants";
import Board from "../Board";
import { generateSliderMoves, getSlidingPieceAttacks } from "./utils";
import Move from "../Move";


class King extends BasePiece {
    constructor(colour: number) {
        super(colour | Pieces.king)
    }

    public override getAttacks(square: number, blockers: bigint) {
        // King cannot be blocked (as it has distance 1), so the empty bitboard of 0 will work
        return getSlidingPieceAttacks(square, [-1, 7, 8, 9, 1, -7, -8, -9], 0n, 1)
    }

    public override getLegalMoves(square: number, board: Board): Array<Move> {
        const pieceColour = this.datum & 0b11000

        // Normal king moves can be thought of a sliding piece with distance 1
        let moves: Array<Move> = generateSliderMoves(square, pieceColour, [-1, 7, 8, 9, 1, -7, -8, -9], board, 1)

        // Castling - MSB is Queen-side castling, LSB is King-side castling. 1 is unavaliable, 0 is avaliable.
        let castlingRights: number

        const opponentColour = pieceColour == Pieces.white ? Pieces.black : Pieces.white

        if (pieceColour === Pieces.white) {
            castlingRights = board.getCastlingRights() & 0b0011
        }
        else {
            castlingRights = (board.getCastlingRights() & 0b1100) >> 2
        }

        // King-side Castling
        if ((castlingRights & 0b01) === 0) {
            const indexesBetween = pieceColour === Pieces.white ? [5, 6] : [61, 62]
            const isLegal = indexesBetween.every(i => board.getSquares()[i].getType() === Pieces.empty && !board.isSquareAttacked(i, opponentColour))

            if (isLegal && !board.isSquareAttacked(square, opponentColour)) {
                moves.push(Move.fromCharacteristics(square + 2, square, false, false, false, 1))
            }
        }

        // Queen-side Castling
        if ((castlingRights & 0b10) === 0) {
            const indexesBetween = pieceColour === Pieces.white ? [2, 3] : [58, 59]
            const squareRookMovesThrough = pieceColour === Pieces.white ? 1 : 57

            const isLegal = indexesBetween.every(i => {
                return board.getSquares()[i].getType() === Pieces.empty && !board.isSquareAttacked(i, opponentColour)
            })

            if (isLegal && !board.isSquareAttacked(square, opponentColour) && board.getSquares()[squareRookMovesThrough].getType() === Pieces.empty) {
                moves.push(Move.fromCharacteristics(square - 2, square, false, false, false, 2))
            }
        }

        return moves
    }
}

export default King