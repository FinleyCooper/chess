import Board from './Board'
import Move from './Move'
import Piece from './Piece'
import { Pieces } from './constants'
import SquareCollection from './SquareCollection'
import { precomputedKnightMoves, precomputedSlidersSeralisedDistances } from './precalculations/results'


export default class MoveGenerator {
    board: Board

    constructor(board: Board) {
        this.board = board
    }

    isSquareAttacked(square: number, attackerColour: number, a: number = 0) {
        // if (a) {
        //     debugger
        // }
        const attackerColourIndex = attackerColour === Pieces.white ? 0 : 1
        const defenderColour = attackerColourIndex == 0 ? Pieces.black : Pieces.white
        const blockers = this.board.collections[Pieces.all][attackerColourIndex].bitboard | this.board.collections[Pieces.all][1 - attackerColourIndex].bitboard

        if (this.getQueenAttacks(square, blockers) & this.board.collections[Pieces.queen][attackerColourIndex].bitboard) {
            return true
        }

        if (this.getBishopAttacks(square, blockers) & this.board.collections[Pieces.bishop][attackerColourIndex].bitboard) {
            return true
        }
        if (this.getRookAttacks(square, blockers) & this.board.collections[Pieces.rook][attackerColourIndex].bitboard) {
            return true
        }
        if (this.getKnightAttacks(square) & this.board.collections[Pieces.knight][attackerColourIndex].bitboard) {
            return true
        }
        if (this.getPawnAttacks(square, defenderColour) & this.board.collections[Pieces.pawn][attackerColourIndex].bitboard) {
            return true
        }

        if (this.getKingAttacks(square) & this.board.collections[Pieces.king][attackerColourIndex].bitboard) {
            return true
        }

        return false
    }

    generateLegalMoves() {
        let moveList: Array<Move> = []

        for (const square of this.board.collections[Pieces.pawn][this.board.sideToMoveIndex]) {
            moveList.push(...this.generatePawnMoves(square, this.board.sideToMove, this.board))
        }


        for (const square of this.board.collections[Pieces.knight][this.board.sideToMoveIndex]) {
            moveList.push(...this.generateKnightMoves(square, this.board.sideToMove, this.board))
        }


        for (const square of this.board.collections[Pieces.rook][this.board.sideToMoveIndex]) {

            moveList.push(...this.generateRookMoves(square, this.board.sideToMove, this.board))
        }

        for (const square of this.board.collections[Pieces.bishop][this.board.sideToMoveIndex]) {

            moveList.push(...this.generateBishopMoves(square, this.board.sideToMove, this.board))
        }


        for (const square of this.board.collections[Pieces.queen][this.board.sideToMoveIndex]) {
            moveList.push(...this.generateQueenMoves(square, this.board.sideToMove, this.board))
        }

        for (const square of this.board.collections[Pieces.king][this.board.sideToMoveIndex]) {
            moveList.push(...this.generateKingMoves(square, this.board.sideToMove, this.board))
        }

        const sideToPlay = this.board.sideToMove

        moveList = moveList.filter(move => {
            this.board.playMove(move)

            let isLegal = true

            if (this.isCheck(sideToPlay)) {
                isLegal = false
            }

            this.board.unplayMove(move)

            return isLegal
        })

        return moveList
    }

    isCheck(sideToPlay: number = this.board.sideToMove) {
        const sideToPlayIndex = sideToPlay === Pieces.white ? 0 : 1
        const opponentColour = sideToPlay === Pieces.white ? Pieces.black : Pieces.white
        const kingBitboard = this.board.collections[Pieces.king][sideToPlayIndex]

        let kingPosition = 0n
        while (kingBitboard.bitboard >> kingPosition !== 1n) {
            kingPosition++
        }


        return this.isSquareAttacked(Number(kingPosition), opponentColour)

    }

    squareCapturable(square: number, byColour: number) {
        return !(square & byColour) && (square !== Pieces.empty)
    }


    getKnightAttacks(square: number) {
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

    getPawnAttacks(square: number, pieceColour: number) {
        let attackBitboard = 0n

        const movementDirection = pieceColour == Pieces.white ? 1 : -1
        const file = square % 8

        // Diagonal captures
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

        // En passant is not an attack, as the pawn that en passants will always end up on an empty square so we don't have to consider it
        return attackBitboard
    }

    getKingAttacks(square: number) {
        // King cannot be blocked (as it has distance 1), so the empty bitboard of 0 will work
        return this.getSlidingPieceAttacks(square, [-1, 7, 8, 9, 1, -7, -8, -9], 0n, 1)
    }

    getBishopAttacks(square: number, blockers: bigint) {
        return this.getSlidingPieceAttacks(square, [7, 9, -7, -9], blockers)
    }

    getRookAttacks(square: number, blockers: bigint) {
        return this.getSlidingPieceAttacks(square, [-1, 8, 1, -8], blockers)
    }

    getQueenAttacks(square: number, blockers: bigint) {
        return this.getSlidingPieceAttacks(square, [-1, 7, 8, 9, 1, -7, -8, -9], blockers)
    }

    getSlidingPieceAttacks(square: number, offsets: Array<number>, blockers: bigint, distance: number = 8) {
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

    generatePawnMoves(square: number, pieceColour: number, board: Board) {
        let moves: Array<Move> = []

        if (square === 34) {
        }
        // If we're white, we're going up the board, if we're black we need to go down
        const movementDirection = pieceColour == Pieces.white ? 1 : -1
        const pieceColourIndex = pieceColour == Pieces.white ? 0 : 1

        const rank = Math.floor(square / 8)
        const file = square % 8

        // One rank ahead, given the target square isn't blocked
        const squareAhead = square + movementDirection * 8

        const promotationRank = pieceColour == Pieces.white ? 6 : 1

        if (board.boardList[squareAhead] == Pieces.empty) {
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

                    if (board.boardList[squareTwoAhead] == Pieces.empty) {
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
        const attacks = new SquareCollection(this.getPawnAttacks(square, pieceColour))

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

    generateKnightMoves(square: number, pieceColour: number, board: Board) {
        let moves: Array<Move> = []

        const attacks = new SquareCollection(this.getKnightAttacks(square))

        const pieceColourIndex = pieceColour == Pieces.white ? 0 : 1

        const opponentPieces = board.collections[Pieces.all][1 - pieceColourIndex]
        const friendlyPieces = board.collections[Pieces.all][pieceColourIndex]

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

    generateRookMoves(square: number, pieceColour: number, board: Board) {
        return this.generateSliderMoves(square, pieceColour, [-1, 8, 1, -8], board)
    }

    generateBishopMoves(square: number, pieceColour: number, board: Board) {

        return this.generateSliderMoves(square, pieceColour, [7, 9, -7, -9], board)
    }

    generateQueenMoves(square: number, pieceColour: number, board: Board) {
        return this.generateSliderMoves(square, pieceColour, [-1, 7, 8, 9, 1, -7, -8, -9], board)
    }

    generateSliderMoves(square: number, pieceColour: number, offsets: Array<number>, board: Board, distance: number = 8) {
        const pieceColourIndex = pieceColour == Pieces.white ? 0 : 1

        const opponentPieces = board.collections[Pieces.all][1 - pieceColourIndex]
        const friendlyPieces = board.collections[Pieces.all][pieceColourIndex]

        const attacks = new SquareCollection(this.getSlidingPieceAttacks(square, offsets, opponentPieces.or(friendlyPieces).bitboard, distance))

        let moves: Array<Move> = []

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

    generateKingMoves(square: number, pieceColour: number, board: Board) {

        // Normal king moves can be thought of a sliding piece with distance 1
        let moves: Array<Move> = this.generateSliderMoves(square, pieceColour, [-1, 7, 8, 9, 1, -7, -8, -9], board, 1)

        // Castling - MSB is Queen-side castling, LSB is King-side castling. 1 is unavaliable, 0 is avaliable.
        let castlingRights: number

        const opponentColour = pieceColour == Pieces.white ? Pieces.black : Pieces.white

        if (pieceColour === Pieces.white) {
            castlingRights = board.castlingRights & 0b0011
        }
        else {
            castlingRights = (board.castlingRights & 0b1100) >> 2
        }

        // King-side Castling
        if ((castlingRights & 0b01) === 0) {
            const indexesBetween = pieceColour === Pieces.white ? [5, 6] : [61, 62]
            const isLegal = indexesBetween.every(i => board.boardList[i] === Pieces.empty && !this.isSquareAttacked(i, opponentColour))



            if (isLegal && !this.isSquareAttacked(square, opponentColour)) {
                moves.push(Move.fromCharacteristics(square + 2, square, false, false, false, 1))
            }
        }

        // Queen-side Castling
        if ((castlingRights & 0b10) === 0) {
            const indexesBetween = pieceColour === Pieces.white ? [2, 3] : [58, 59]
            const squareRookMovesThrough = pieceColour === Pieces.white ? 1 : 57

            const isLegal = indexesBetween.every(i => {
                return board.boardList[i] === Pieces.empty && !this.isSquareAttacked(i, opponentColour)
            })

            for (const a of indexesBetween) {
                // console.log(square)
                // console.log(board.boardList[square] === Pieces.empty && !this.isSquareAttacked(square, opponentColour))
            }

            if (isLegal && !this.isSquareAttacked(square, opponentColour, 1) && board.boardList[squareRookMovesThrough] === Pieces.empty) {
                moves.push(Move.fromCharacteristics(square - 2, square, false, false, false, 2))
            }
        }

        return moves
    }

    generateBinaryUCILegalMoves() {
        const moveList: Array<Move> = this.generateLegalMoves()
        return [...new Set(moveList.map(move => move.toBinaryUCI()))]
    }
}