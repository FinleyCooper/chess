export default class SquareCollection {
    public bitboard: bigint
    protected iteratingBoard: bigint

    constructor(bitboard: bigint = 0n) {
        this.bitboard = bitboard
        this.iteratingBoard = bitboard
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

    static flipVertically(bitboard: bigint) {
        // NOT MY IMPLEMENTATION : Reference -> https://www.chessprogramming.org/Flipping_Mirroring_and_Rotating#Horizontal
        return ((bitboard << 56n)) |
            ((bitboard << 40n) & (0x00ff000000000000n)) |
            ((bitboard << 24n) & (0x0000ff0000000000n)) |
            ((bitboard << 8n) & (0x000000ff00000000n)) |
            ((bitboard >> 8n) & (0x00000000ff000000n)) |
            ((bitboard >> 24n) & (0x0000000000ff0000n)) |
            ((bitboard >> 40n) & (0x000000000000ff00n)) |
            ((bitboard >> 56n));
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

    log() {
        // Generated automatically using Github Copilot
        let bitboard = SquareCollection.flipVertically(this.bitboard)

        let str = ''
        for (let i = 0; i < 64; i++) {
            if (bitboard & (1n << BigInt(i))) {
                str += '1'
            } else {
                str += '0'
            }
            if (i % 8 === 7) {
                str += '\n'
            }
        }
        console.log(str)
    }
}