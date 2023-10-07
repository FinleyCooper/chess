import { Pieces } from './constants'
import Move from './Move'
import SquareCollection from './SquareCollection'
import Piece from './Pieces'
import BasePiece from './Pieces/BasePiece'

class Board {
    private sideToMove: number
    private sideToMoveIndex: number
    private pastBoards: Array<number>
    private epFile: number
    private castlingRights: number
    private pieceCapturedPlyBefore: number
    private pastGameStateStack: Array<number>

    private square: Array<BasePiece>
    private collections: Array<Array<SquareCollection>>

    constructor(binaryBoard: Uint8Array, gameState: number) {
        this.pastGameStateStack = [] // LIFO stack
        this.pastBoards = [] // LIFO stack

        this.sideToMoveIndex = (gameState & 0b1) // 0 is white and 1 is black
        this.sideToMove = this.sideToMoveIndex ? Pieces.black : Pieces.white
        this.epFile = (gameState & 0b11110) >> 1
        this.castlingRights = (gameState & 0b111100000) >> 5
        this.pieceCapturedPlyBefore = (gameState & 0b111000000000) >> 9

        this.square = Array(64).fill(new Piece.Empty())

        this.collections = [
            [new SquareCollection(), new SquareCollection()], // All     : index 0
            [new SquareCollection(), new SquareCollection()], // Pawns   : index 1
            [new SquareCollection(), new SquareCollection()], // Rooks   : index 2
            [new SquareCollection(), new SquareCollection()], // Knights : index 3
            [new SquareCollection(), new SquareCollection()], // Bishops : index 4
            [new SquareCollection(), new SquareCollection()], // Queens  : index 5
            [new SquareCollection(), new SquareCollection()], // Kings   : index 6            
        ]


        for (let i = 0; i < binaryBoard.length; i++) {
            this.square[i] = Piece.FromBinary(binaryBoard[i])

            if (binaryBoard[i] !== 0) {
                const colourIndex = +this.square[i].isColour(Pieces.black)
                this.collections[this.square[i].getType()][colourIndex].add(i)
            }
        }

        this.updateAllPieceCollection()
    }

    hasPositionOccurredBefore(): boolean {
        return this.pastBoards.includes(this.hashBoard())
    }

    getCollections(): Array<Array<SquareCollection>> {
        return this.collections
    }

    getEpFile(): number {
        return this.epFile
    }

    getSquares(): Array<BasePiece> {
        return this.square
    }

    getSideToMove(): number {
        return this.sideToMove
    }

    getSideToMoveIndex(): number {
        return this.sideToMoveIndex
    }

    getCastlingRights(): number {
        return this.castlingRights
    }

    private updateAllPieceCollection() {
        this.collections[Pieces.all] = [new SquareCollection(), new SquareCollection()]
        for (let i = 1; i < this.collections.length; i++) {
            for (let j = 0; j < 2; j++) {
                this.collections[Pieces.all][j] = this.collections[Pieces.all][j].or(this.collections[i][j])
            }
        }
    }

    getGameState() {
        return this.sideToMoveIndex | (this.epFile << 1) | (this.castlingRights << 5) | (this.pieceCapturedPlyBefore << 9)
    }

    playUCIMove(from: number, to: number) {
        let move: Move

        const movedPiece = this.square[from]
        const destPiece = this.square[to]

        // Double pawn move - If we're moving a pawn and it moves 16 squares
        if (movedPiece.getType() == Pieces.pawn && Math.abs(from - to) === 16) {
            move = Move.fromCharacteristics(to, from, false, true)
        }

        // En passant - If we're moving a pawn and it moves diagonally to an empty square
        else if (movedPiece.getType() == Pieces.pawn && destPiece.getType() == Pieces.empty && [7, 9].includes(Math.abs(from - to))) {
            move = Move.fromCharacteristics(to, from, true, false, true)
        }

        // Promotion
        else if (movedPiece.getType() == Pieces.pawn && Math.floor(to / 8) % 7 == 0) {
            if (this.square[to].getType() === Pieces.empty) {
                move = Move.fromCharacteristics(to, from, false, false, false, 0, 0b011) // ALways promote to a queen (for the user)
            }
            else {
                move = Move.fromCharacteristics(to, from, true, false, false, 0, 0b011)
            }
        }

        // Castling KS
        else if (movedPiece.getType() == Pieces.king && (to - from) === 2) {
            move = Move.fromCharacteristics(to, from, false, false, false, 1)
        }
        // Castling QS
        else if (movedPiece.getType() == Pieces.king && (to - from) === -2) {
            move = Move.fromCharacteristics(to, from, false, false, false, 2)
        }

        // Capture
        else if (this.square[to].getType() !== Pieces.empty) {
            move = Move.fromCharacteristics(to, from, true)
        }
        // Quiet Move
        else {
            move = Move.fromCharacteristics(to, from)
        }

        this.playMove(move)

        return move
    }

    private hashBoard(): number {
        return this.square.reduce((running_total, currentPiece, index) => {
            return running_total ^ (currentPiece.datum << (index >> 1)) // max index is 63, so max (index >> 1) is 31, within the javascript limit of 32 bits for bitwise operations 
        }, this.getGameState())
    }

    playMove(move: Move) {
        // Calculate the current game state and push it to the top of the pastGameState stack
        this.pastGameStateStack.push(this.getGameState())
        this.pastBoards.push(this.hashBoard())

        const flag = move.getFlag()
        const dest = move.getDestinationSquare()
        const source = move.getSourceSquare()

        const piece = this.square[source]

        const colourOffset = piece.isColour(Pieces.white) ? 0 : 56

        this.pieceCapturedPlyBefore = Pieces.empty

        // Remove piece from source square
        // In the square-oriented data structure
        this.square[source] = new Piece.Empty()

        // And in the piece-oriented data structure
        this.collections[piece.getType()][piece.getColourIndex()].remove(source)

        // Add the piece to the destination square. We will have to check for flag scenarios however.

        // En passant flag
        if (flag === 0b0101) {
            const enPassantSquare = dest + (piece.isColour(Pieces.white) ? -8 : 8)

            // Only pawns can be en-passanted
            this.collections[Pieces.pawn][piece.getOpponentColourIndex()].remove(enPassantSquare)

            this.square[enPassantSquare] = new Piece.Empty()
        }

        // Castling - KS
        else if (flag === 0b0010) {
            this.collections[Pieces.rook][piece.getColourIndex()].remove(7 + colourOffset)
            this.collections[Pieces.rook][piece.getColourIndex()].add(5 + colourOffset)

            this.square[7 + colourOffset] = new Piece.Empty()
            this.square[5 + colourOffset] = new Piece.Rook(piece.getColour())
        }

        // Castling - QS
        else if (flag === 0b0011) {
            this.collections[Pieces.rook][piece.getColourIndex()].remove(0 + colourOffset)
            this.collections[Pieces.rook][piece.getColourIndex()].add(3 + colourOffset)

            this.square[0 + colourOffset] = new Piece.Empty()
            this.square[3 + colourOffset] = new Piece.Rook(piece.getColour())
        }


        // If the move is a capture we will have to remove the captured piece from its collection (unless en-passant, but that is handled seperately)
        else if (move.isCapture()) {
            const capturedPiece = this.square[dest]

            if (capturedPiece.getType() === Pieces.rook) {
                const shift = capturedPiece.isColour(Pieces.white) ? 0 : 2

                if (dest + colourOffset - 56 === 7) {
                    // Remove KS castling rights
                    this.castlingRights |= 0b0001 << shift
                }
                else if (dest + colourOffset - 56 === 0) {
                    // Remove QS castling rights
                    this.castlingRights |= 0b0010 << shift
                }
            }

            this.collections[capturedPiece.getType()][capturedPiece.getColourIndex()].remove(dest)
            this.pieceCapturedPlyBefore = capturedPiece.getType()
        }

        // Check if the rook or king has moved (we will remove castling rights) This will also take care of removing castling rights when castling
        if (piece.getType() === Pieces.king) {
            // Remove all castling rights
            const shift = piece.isColour(Pieces.white) ? 0 : 2
            this.castlingRights |= 0b0011 << shift
        }
        else if (piece.getType() === Pieces.rook) {
            const shift = piece.isColour(Pieces.white) ? 0 : 2

            if (source - colourOffset === 7) {
                // Remove KS castling rights
                this.castlingRights |= 0b0001 << shift
            }
            if (source - colourOffset === 0) {
                // Remove QS castling rights
                this.castlingRights |= 0b0010 << shift
            }
        }

        // Check if we're promoting
        let destinationPiece = piece

        if (move.isPromotion()) {
            destinationPiece = Piece.FromBinary(piece.getColour() | move.getPromotionPiece())
        }

        // Add the piece in the square-oriented data structure. This will automatically take care of non-enpassant captures
        this.square[dest] = destinationPiece
        // Add the piece into the piece-oriented data structure
        this.collections[destinationPiece.getType()][destinationPiece.getColourIndex()].add(dest)

        // Double pawn push means en passant is possible for the next turn on that file
        if (flag === 0b0001) {
            this.epFile = (dest % 8) + 1
        }
        else {
            this.epFile = 0
        }

        this.updateAllPieceCollection()

        this.sideToMoveIndex = 1 - this.sideToMoveIndex
        this.sideToMove = this.sideToMoveIndex ? Pieces.black : Pieces.white
    }

    unplayMove(move: Move) {
        // Remove the most recent gamestate
        const newGameState = this.pastGameStateStack.pop()
        this.pastBoards.pop()

        if (newGameState === undefined) {
            throw "No move to unplay!"
        }

        this.sideToMoveIndex = (newGameState & 0b1)
        this.sideToMove = this.sideToMoveIndex ? Pieces.black : Pieces.white

        const opponentMoveIndex = 1 - this.sideToMoveIndex
        const opponentColour = this.sideToMoveIndex ? Pieces.white : Pieces.black

        const flag = move.getFlag()
        const dest = move.getDestinationSquare()
        const source = move.getSourceSquare()


        const pieceCapturedLastPly = this.pieceCapturedPlyBefore === Pieces.empty ? Pieces.empty : this.pieceCapturedPlyBefore | opponentColour

        let piece = this.square[dest]

        const colourOffset = piece.isColour(Pieces.white) ? 0 : 56

        // Removed moved piece from data strucutures and replace it with an empty square or the captured piece
        this.square[dest] = Piece.FromBinary(pieceCapturedLastPly)
        this.collections[piece.getType()][this.sideToMoveIndex].remove(dest)

        // Handle en passant
        if (move.isEnPassant()) {
            const enPassantOffset = piece.isColour(Pieces.white) ? -8 : 8

            this.square[dest + enPassantOffset] = new Piece.Pawn(opponentColour)
            this.collections[Pieces.pawn][opponentMoveIndex].add(dest + enPassantOffset)
        }
        else if (move.isPromotion()) {
            piece = new Piece.Pawn(this.sideToMove)
        }
        // KS castling
        else if (flag === 0b0010) {
            this.collections[Pieces.rook][this.sideToMoveIndex].remove(5 + colourOffset)
            this.collections[Pieces.rook][this.sideToMoveIndex].add(7 + colourOffset)

            this.square[5 + colourOffset] = new Piece.Empty()
            this.square[7 + colourOffset] = new Piece.Rook(this.sideToMove)
        }
        // QS castling
        else if (flag === 0b0011) {
            this.collections[Pieces.rook][this.sideToMoveIndex].remove(3 + colourOffset)
            this.collections[Pieces.rook][this.sideToMoveIndex].add(0 + colourOffset)

            this.square[3 + colourOffset] = new Piece.Empty()
            this.square[0 + colourOffset] = new Piece.Rook(this.sideToMove)
        }
        // Will also take care of promotion captures
        if (move.isCapture() && !move.isEnPassant()) {
            this.collections[pieceCapturedLastPly & 0b111][opponentMoveIndex].add(dest)
        }

        // Source square replace with the moved piece
        this.square[source] = piece
        this.collections[piece.getType()][this.sideToMoveIndex].add(source)

        this.castlingRights = (newGameState & 0b111100000) >> 5
        this.pieceCapturedPlyBefore = (newGameState & 0b111000000000) >> 9
        this.epFile = (newGameState & 0b11110) >> 1
        this.updateAllPieceCollection()
    }

    isSquareAttacked(square: number, attackerColour: number): boolean {
        const attackerColourIndex = attackerColour === Pieces.white ? 0 : 1
        const defenderColour = attackerColourIndex == 0 ? Pieces.black : Pieces.white
        const blockers = this.collections[Pieces.all][attackerColourIndex].getBitboard() | this.collections[Pieces.all][1 - attackerColourIndex].getBitboard()

        // Looping over all pieces binary values

        for (let i = 1; i < Pieces.king + 1; i++) {
            const piece = Piece.FromBinary(i | defenderColour)

            if (piece.getAttacks(square, blockers) & this.collections[i][attackerColourIndex].getBitboard()) {
                return true
            }
        }

        return false
    }

    generateLegalMoves(): Array<Move> {
        let moveList: Array<Move> = []

        for (let i = 0; i < 64; i++) {
            if (this.square[i].isColour(this.sideToMove)) {
                moveList.push(...this.square[i].getLegalMoves(i, this))
            }
        }

        // All pieces that lie in the attack bitboard of the king in all offsets
        const piece = new Piece.Queen(Pieces.white)

        const kingBitboard = this.collections[Pieces.king][this.sideToMoveIndex]

        let kingPosition = 0n
        while (kingBitboard.getBitboard() >> kingPosition !== 1n) {
            kingPosition++
        }

        const attacks = piece.getAttacks(Number(kingPosition), this.collections[Pieces.all][1 - this.sideToMoveIndex].getBitboard())
        const isPinning = attacks & this.collections[Pieces.bishop][1 - this.sideToMoveIndex].getBitboard()
            | this.collections[Pieces.rook][1 - this.sideToMoveIndex].getBitboard()
            | this.collections[Pieces.queen][1 - this.sideToMoveIndex].getBitboard()


        // We only need to check moves of pinned pieces and king moves and en passant
        const sideToPlay = this.sideToMove
        const opponentColour = sideToPlay === Pieces.white ? Pieces.black : Pieces.white

        const isCheck = this.isSquareAttacked(Number(kingPosition), opponentColour)

        moveList = moveList.filter(move => {
            const sourceSquare = move.getSourceSquare()

            if (this.square[sourceSquare].getType() === Pieces.king) {
                this.collections[Pieces.all][this.sideToMoveIndex].remove(sourceSquare)
                const isLegal = !this.isSquareAttacked(move.getDestinationSquare(), opponentColour)
                this.collections[Pieces.all][this.sideToMoveIndex].add(sourceSquare)
                return isLegal
            }

            const isPsuedoPinned = isPinning && ((attacks >> BigInt(sourceSquare)) & 1n)
            if (isCheck || isPsuedoPinned || move.isEnPassant()) {
                this.playMove(move)
                const isLegal = !this.isSquareAttacked(Number(kingPosition), opponentColour)
                this.unplayMove(move)

                return isLegal
            }
            else {
                return true
            }
        })

        return moveList
    }

    isCheck(sideToPlay: number = this.sideToMove) {
        const sideToPlayIndex = sideToPlay === Pieces.white ? 0 : 1
        const opponentColour = sideToPlay === Pieces.white ? Pieces.black : Pieces.white
        const kingBitboard = this.collections[Pieces.king][sideToPlayIndex]

        let kingPosition = 0n
        while (kingBitboard.getBitboard() >> kingPosition !== 1n) {
            kingPosition++
        }

        return this.isSquareAttacked(Number(kingPosition), opponentColour)
    }

    isCheckmate() {
        return this.generateLegalMoves().length === 0 && this.isCheck()
    }

    isStalemate() {
        return this.generateLegalMoves().length === 0 && !this.isCheck()
    }

    getBoardData() {
        return this.getGameState() >> 1
    }

    generateBinaryUCILegalMoves() {
        const moveList: Array<Move> = this.generateLegalMoves()
        return [...new Set(moveList.map(move => move.toBinaryUCI()))]
    }

    toBinary() {
        let binaryBoard = new Uint8Array(64)

        for (let i = 0; i < 64; i++) {
            binaryBoard[i] = this.square[i].datum
        }

        return binaryBoard
    }
}

export default Board