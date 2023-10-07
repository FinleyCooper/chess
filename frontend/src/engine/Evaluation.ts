import Board from "./Board";
import { Pieces } from "./constants";
import { PieceSquareTable, Customisation } from "./Engine";

export const pieceValue: { [key: number]: number } = {
    0: 0,
    1: 100,
    2: 500,
    3: 300,
    4: 300,
    5: 900,
    6: 0,
}


export default (board: Board, customisation: Customisation, pieceSquareTables: PieceSquareTable) => {
    // Positive is good for white, negative is good for black

    // Material Counting
    let whiteMaterial = 0
    let whitePieceSquareBonus = 0
    let blackMaterial = 0
    let blackPieceSquareBonus = 0

    // To see if we should start looking for checkmates, we see if the opponent has little pieces left, by calculating the Hamming weight of the all pieces bitboard
    let bitboard = board.getCollections()[Pieces.all][1 - board.getSideToMoveIndex()].getBitboard()

    let hammingWeight = 0

    while (bitboard) {
        bitboard &= (bitboard - 1n) // Removes the lowest 1s bit
        hammingWeight += 1
    }

    const isOpponentStruggling = hammingWeight < 8n

    for (let i = 0; i < 64; i++) {
        const pieceType = board.getSquares()[i].getType()
        let pieceSquareTableIndex = pieceType === Pieces.king && isOpponentStruggling ? pieceType + 1 : pieceType

        if (board.getSquares()[i].isColour(Pieces.white)) {
            whiteMaterial += pieceValue[pieceType]
            whitePieceSquareBonus += pieceSquareTables[0][pieceSquareTableIndex][i] * (isOpponentStruggling ? 0.2 : 1) // Material is more important in the endgame
        }
        else if ((board.getSquares()[i].isColour(Pieces.black))) {
            blackMaterial += pieceValue[pieceType]
            blackPieceSquareBonus += pieceSquareTables[1][pieceSquareTableIndex][i] * (isOpponentStruggling ? 0.2 : 1)
        }
    }

    // Checkmating - For mates with rooks and queens the king must go towards the sides of the board and the king must be brought closer
    const opponentKingBitboard = board.getCollections()[Pieces.king][1 - board.getSideToMoveIndex()]
    const ourKingBitboard = board.getCollections()[Pieces.king][board.getSideToMoveIndex()]

    let checkmateBonus = 0

    if (isOpponentStruggling) {
        let opponentKingPositionBig = 0n
        while (opponentKingBitboard.getBitboard() >> opponentKingPositionBig !== 1n) {
            opponentKingPositionBig++
        }

        let ourKingPositionBig = 0n
        while (ourKingBitboard.getBitboard() >> ourKingPositionBig !== 1n) {
            ourKingPositionBig++
        }

        const opponentKingPosition = Number(opponentKingPositionBig)
        const ourKingPosition = Number(opponentKingPosition)

        // Taxicab distance between kings
        const kingDistance = Math.abs((opponentKingPosition % 8) - (ourKingPosition % 8)) + Math.abs(Math.floor(opponentKingPosition / 8) - Math.floor(ourKingPosition / 8))

        checkmateBonus += 10 * (16 - kingDistance)

        // Taxicab distance between opponent king and corner of the board
        const corneringDistance = ((opponentKingPosition % 8) % 7) + (Math.floor(opponentKingPosition / 8) % 7)

        checkmateBonus += 25 * (16 - corneringDistance)
    }

    // If happy to trade, then we prefer boards with fewer pieces,
    if (board.getSideToMove() === Pieces.white) {
        return whiteMaterial - blackMaterial + whitePieceSquareBonus - blackPieceSquareBonus + checkmateBonus + (-(customisation.tradeHappy - 50) * blackMaterial) * 0.0005
    }
    else {
        return blackMaterial - whiteMaterial + blackPieceSquareBonus - whitePieceSquareBonus + checkmateBonus + (-(customisation.tradeHappy - 50) * whiteMaterial) * 0.0005
    }

}