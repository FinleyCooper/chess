import Board from '../Board';
import Move from '../Move';

// Abstact base class representing a Piece
class BasePiece {
    readonly datum: number

    constructor(datum: number) {
        if (this.constructor === BasePiece) {
            throw new Error("Cannot construct BasePiece abstract class")
        }

        this.datum = datum
    }

    public getColour() {
        return this.datum & 0b11000
    }

    public getType() {
        return this.datum & 0b00111
    }

    public isColour(colour: number) {
        return (this.datum & 0b11000) === colour
    }

    public getColourIndex() {
        // 0 is white 1 is black
        return +!!(this.datum & 8)
    }

    public getOpponentColourIndex() {
        return +!(this.datum & 8)
    }

    public getLegalMoves(square: number, board: Board): Array<Move> {
        return []
    }

    public getAttacks(square: number, blockers: bigint): bigint {
        return 0n
    }

    public isDifferentColour(piece: BasePiece) {
        // Shift datum so only the white bit is left
        // If the pieces are different the XOR operation will be true
        return (piece.datum >> 4) ^ (this.datum >> 4)
    }

}

export default BasePiece