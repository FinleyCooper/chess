export default class SquareCollection {
    private bitboard: bigint
    private iteratingBoard: bigint


    constructor(bitboard: bigint = 0n) {
        this.bitboard = bitboard
        this.iteratingBoard = bitboard
    }

    getBitboard() {
        return this.bitboard

    }

    add(square: number) {
        this.bitboard |= 1n << BigInt(square)
    }

    remove(square: number) {
        this.bitboard &= ~(1n << BigInt(square))
    }

    or(collection: SquareCollection) {
        return new SquareCollection(this.bitboard | collection.bitboard)
    }

    and(collection: SquareCollection) {
        return new SquareCollection(this.bitboard & collection.bitboard)
    }

    not() {
        // Not the first 64 bits of the bitboard (we can't use ~ because bigint is a signed 2's complement number)
        return new SquareCollection((~this.bitboard) & 0xffffffffffffffffn)
    }

    *[Symbol.iterator]() {
        for (let i = 0; i < 64; i++) {
            if (i == 0) {
                this.iteratingBoard = this.bitboard
            }
            if (this.iteratingBoard & 1n) {
                yield i
            }
            this.iteratingBoard >>= 1n
        }
        this.iteratingBoard = this.bitboard
    }
}