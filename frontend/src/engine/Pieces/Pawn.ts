import BasePiece from "./BasePiece";
import { Pieces } from "../constants";
import Board from "../Board";
import Move from "../Move";
import SquareCollection from "../SquareCollection";


class Pawn extends BasePiece {
    constructor(colour: number) {
        super(colour | Pieces.pawn)
    }

    public override getAttacks(square: number, blockers: bigint) {
        const pieceColour = this.getColour()

        let attackBitboard = 0n

        const movementDirection = pieceColour == Pieces.white ? 1 : -1
        const file = square % 8

        const LHCaptureSquare: number = square + movementDirection * 7
        const RHCaptureSquare: number = square + movementDirection * 9

        const isOnLeftFile: boolean = file === (pieceColour == Pieces.white ? 0 : 7)
        const isOnRightFile: boolean = file === (pieceColour == Pieces.white ? 7 : 0)

        if (!isOnLeftFile) {
            attackBitboard |= 1n << BigInt(LHCaptureSquare)
        }

        if (!isOnRightFile) {
            attackBitboard |= 1n << BigInt(RHCaptureSquare)
        }

        return attackBitboard

    }

    public override getLegalMoves(square: number, board: Board): Array<Move> {
        const pieceColour = this.getColour()

        let moves: Array<Move> = []

        // If we're white, we're going up the board, if we're black we need to go down
        const movementDirection = pieceColour == Pieces.white ? 1 : -1
        const pieceColourIndex = pieceColour == Pieces.white ? 0 : 1

        const rank = Math.floor(square / 8)
        const file = square % 8

        // One rank ahead, given the target square isn't blocked
        const squareAhead = square + movementDirection * 8

        const promotationRank = pieceColour == Pieces.white ? 6 : 1

        if (board.square[squareAhead].getType() == Pieces.empty) {
            if (rank === promotationRank) {
                for (let i = 1; i < 5; i++) {
                    moves.push(Move.fromCharacteristics(squareAhead, square, false, false, false, 0, i))
                }
            }
            else {
                moves.push(Move.fromCharacteristics(squareAhead, square))
                // Two ranks ahead, given the target square isn't blocked
                const isFirstMove = ((pieceColour == Pieces.white) && (rank === 1)) || ((pieceColour == Pieces.black) && (rank === 6))

                if (isFirstMove) {
                    const squareTwoAhead = squareAhead + movementDirection * 8

                    if (board.square[squareTwoAhead].getType() == Pieces.empty) {
                        moves.push(Move.fromCharacteristics(squareTwoAhead, square, false, true))
                    }
                }
            }

        }

        // En passant
        if (board.epFile !== 0) {
            const LHCaptureSquare: number = square + movementDirection * 7
            const RHCaptureSquare: number = square + movementDirection * 9
            const epRank = pieceColour === Pieces.white ? 4 : 3
            const epFile = board.epFile - 1

            if (epRank === rank && (epFile - 1 === file || epFile + 1 === file)) {
                const enPassantCaptureSquare = movementDirection * epFile > movementDirection * file ? RHCaptureSquare : LHCaptureSquare
                moves.push(Move.fromCharacteristics(enPassantCaptureSquare, square, true, false, true))
            }
        }


        // Captures and promotions
        const attacks = new SquareCollection(this.getAttacks(square, 0n))

        // Bitwise AND on the attacks and the opponent's pieces to see which attacks are actually captures
        const captures = attacks.and(board.collections[Pieces.all][1 - pieceColourIndex])

        for (const captureSquare of captures) {
            if (rank === promotationRank) {
                for (let i = 1; i < 5; i++) {
                    moves.push(Move.fromCharacteristics(captureSquare, square, true, false, false, 0, i))
                }
            }
            else {
                moves.push(Move.fromCharacteristics(captureSquare, square, true))
            }
        }

        return moves
    }
}

export default Pawn