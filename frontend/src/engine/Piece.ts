import { Pieces } from './constants'
import { } from './Pieces'


class Piece {
    readonly datum: number

    constructor(datum: number) {
        this.datum = datum
    }

    isColour(colour: number) {
        return !!(this.datum & colour)
    }

    getColour() {
        return this.datum & 0b11000
    }

    isDifferentColour(piece: Piece) {
        // Shift datum so only the white bit is left
        // If the pieces are different the XOR operation will be true
        return (piece.datum >> 4) ^ (this.datum >> 4)
    }

    getType() {
        return this.datum & 0b111
    }

    getColourIndex() {
        // 0 is white 1 is black
        return +!!(this.datum & Pieces.black)
    }

    getOpponentColourIndex() {
        return +!(this.datum & Pieces.black)
    }
}

export default Piece