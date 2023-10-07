// Square coordinate is represented with 6 bits (2^6 = 64)
// So a Move is a 'from' square (6 bits) 'to' square (6 bits) and 4 move 'flags' as shown here https://www.chessprogramming.org/Encoding_Moves
// This gives a total 16 bits, meaning each move can be represented within a 16 bit word
//
//  Move ->     0    0    0    0    0    0    0    0    0    0    0    0    0    0    0    0
//             |__________________________|  |__________________________|  |________________|
//                 Destination Square              Source Square                Flags

// Flag bits (from least significant to most significant) text in brackets is situations where the flag is 1 (toggled)
// special 0 (holy hell, double pawn push, O-O-O, bishop or queen promotion/promotion capture)
// special 1 (Castling, rook or queen promotion/promotion capture)
// capture (all capture, including en passant and promotion captures)
// promotation (promotions including promotion captures)
// 1. e4 is 53824 or 110100 100100 0000
export const Pieces = {
    empty: 0,
    pawn: 1,
    rook: 2,
    knight: 3,
    bishop: 4,
    queen: 5,
    king: 6,
    black: 8,
    white: 16
}


class Move {
    readonly datum: number

    private static destinationSquareMask: number = 0xFC00
    private static sourceSquareMask: number = 0x03F0
    private static flagMask: number = 0x000F

    static fromCharacteristics(
        dest: number,
        source: number,
        capture: boolean = false,
        doublePawn: boolean = false,
        ep: boolean = false,
        castle: number = 0, // 1 is ks, 2 is qs
        promotion: number = 0 // 1 is knight, 2 is bishop, 3 is rook, and 4 is queen
    ) {
        const promotationBit = promotion ? 1 : 0
        const captureBit = (ep || capture) ? 1 : 0
        const special1Bit = (castle || promotion > 2) ? 1 : 0
        const special0Bit = (doublePawn || castle == 2 || ep || promotion >> 1 == 1) ? 1 : 0

        const flag = promotationBit << 3 | captureBit << 2 | special1Bit << 1 | special0Bit

        let datum = (dest << 10) | (source << 4) | flag

        return new this(datum)
    }

    static binarySquareToCoordinate(square: number) {
        const rank = Math.floor(square / 8) + 1
        const file = String.fromCharCode(97 + (square % 8))

        return `${file}${rank}`
    }

    constructor(datum: number) {
        this.datum = datum
    }

    getDestinationSquare() {
        return (this.datum & Move.destinationSquareMask) >> 10
    }

    getSourceSquare() {
        return (this.datum & Move.sourceSquareMask) >> 4
    }

    getFlag() {
        return this.datum & Move.flagMask
    }

    toBinaryUCI() {
        return this.datum >> 4
    }

    toLetterUCI() {
        const destinationSquare = this.datum >> 10
        const sourceSquare = (this.datum & Move.sourceSquareMask) >> 4

        let promotationLetter = ""

        if (this.isPromotion()) {
            switch (this.datum & 0b11) {
                case 0b00:
                    promotationLetter = "n"
                    break
                case 0b01:
                    promotationLetter = "b"
                    break
                case 0b10:
                    promotationLetter = "r"
                    break
                case 0b11:
                    promotationLetter = "q"
                    break
                default:
                    break
            }
        }

        return `${Move.binarySquareToCoordinate(sourceSquare)}${Move.binarySquareToCoordinate(destinationSquare)}${promotationLetter}`
    }

    isPromotion() {
        return !!(this.datum & 0b1000)
    }

    isCapture() {
        return !!(this.datum & 0b0100)
    }

    isEnPassant() {
        return (this.datum & Move.flagMask) === 0b0101
    }

    getPromotionPiece() {
        if (!this.isPromotion()) {
            return Pieces.empty
        }

        switch (this.datum & 0b11) {
            case 0b00:
                return Pieces.knight
            case 0b01:
                return Pieces.bishop
            case 0b10:
                return Pieces.rook
            case 0b11:
                return Pieces.queen
            default:
                return Pieces.empty
        }
    }
}

export default Move
