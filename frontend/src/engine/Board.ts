import { Pieces } from './constants'
import Piece from './Piece'
import Move from './Move'
import SquareCollection from './SquareCollection'

class Board {
    boardList: Uint8Array
    sideToMove: number
    epFile: number
    castlingRights: number
    sideToMoveIndex: number
    pieceCapturedPlyBefore: number
    pastGameStateStack: Array<number>

    square: Array<Pieces>
    collections: Array<Array<SquareCollection>>

    constructor(board: Uint8Array, gameState: number) {
        this.boardList = board
        this.pastGameStateStack = [] // LIFO stack

        this.sideToMoveIndex = (gameState & 0b1) // 0 is white and 1 is black
        this.sideToMove = this.sideToMoveIndex ? Pieces.black : Pieces.white
        this.epFile = (gameState & 0b11110) >> 1
        this.castlingRights = (gameState & 0b111100000) >> 5
        this.pieceCapturedPlyBefore = (gameState & 0b111000000000) >> 9

        this.square = []

        this.collections = [
            [new SquareCollection(), new SquareCollection()], // All     : index 0
            [new SquareCollection(), new SquareCollection()], // Pawns   : index 1
            [new SquareCollection(), new SquareCollection()], // Rooks   : index 2
            [new SquareCollection(), new SquareCollection()], // Knights : index 3
            [new SquareCollection(), new SquareCollection()], // Bishops : index 4
            [new SquareCollection(), new SquareCollection()], // Queens  : index 5
            [new SquareCollection(), new SquareCollection()], // Kings   : index 6            
        ]


        for (let i = 0; i < this.boardList.length; i++) {
            if (this.boardList[i] !== 0) {
                const piece = new Piece(this.boardList[i])
                const colourIndex: number = +piece.isColour(Pieces.black)
                this.collections[piece.getType()][colourIndex].add(i)
            }
        }

        this.updateAllPieceCollection()
    }

    updateAllPieceCollection() {
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

        const movedPiece = new Piece(this.boardList[from])
        const destPiece = new Piece(this.boardList[to])

        // Double pawn move - If we're moving a pawn and it moves 16 squares
        if (movedPiece.getType() == Pieces.pawn && Math.abs(from - to) === 16) {
            move = Move.fromCharacteristics(to, from, false, true)
        }

        // En passant - If we're moving a pawn and it moves diagonally to an empty square
        else if (movedPiece.getType() == Pieces.pawn && destPiece.getType() == Pieces.empty && [7, 9].includes(Math.abs(from - to))) {
            move = Move.fromCharacteristics(to, from, true, false, true)
        }

        // Promotion
        else if (movedPiece.getType() == Pieces.pawn && Math.floor(to / 8) == 7) {
            if (this.boardList[to] === Pieces.empty) {
                move = Move.fromCharacteristics(to, from, false, false, false, 0, 0b011)
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
        else if (this.boardList[to] !== Pieces.empty) {
            move = Move.fromCharacteristics(to, from, true)
        }
        // Quiet Move
        else {
            move = Move.fromCharacteristics(to, from)
        }

        this.playMove(move)

        return move
    }

    playMove(move: Move) {
        // Calculate the current game state and push it to the top of the pastGameState stack
        this.pastGameStateStack.push(this.getGameState())

        const flag = move.getFlag()
        const dest = move.getDestinationSquare()
        const source = move.getSourceSquare()

        const piece = new Piece(this.boardList[source])

        const colourOffset = piece.isColour(Pieces.white) ? 0 : 56

        this.pieceCapturedPlyBefore = Pieces.empty

        // Remove piece from source square
        // In the square-oriented data structure
        this.boardList[source] = Pieces.empty

        // And in the piece-oriented data structure
        this.collections[piece.getType()][piece.getColourIndex()].remove(source)

        // Add the piece to the destination square. We will have to check for flag scenarios however.

        // En passant flag
        if (flag === 0b0101) {
            const enPassantSquare = dest + (piece.isColour(Pieces.white) ? -8 : 8)

            // Only pawns can be en-passanted
            this.collections[Pieces.pawn][piece.getOpponentColourIndex()].remove(enPassantSquare)

            this.boardList[enPassantSquare] = Pieces.empty
        }

        // Castling - KS
        else if (flag === 0b0010) {
            this.collections[Pieces.rook][piece.getColourIndex()].remove(7 + colourOffset)
            this.collections[Pieces.rook][piece.getColourIndex()].add(5 + colourOffset)

            this.boardList[7 + colourOffset] = Pieces.empty
            this.boardList[5 + colourOffset] = Pieces.rook | piece.getColour()
        }

        // Castling - QS
        else if (flag === 0b0011) {
            this.collections[Pieces.rook][piece.getColourIndex()].remove(0 + colourOffset)
            this.collections[Pieces.rook][piece.getColourIndex()].add(3 + colourOffset)

            this.boardList[0 + colourOffset] = Pieces.empty
            this.boardList[3 + colourOffset] = Pieces.rook | piece.getColour()
        }


        // If the move is a capture we will have to remove the captured piece from its collection (unless en-passant, but that is handled seperately)
        else if (move.isCapture()) {
            const capturedPiece = new Piece(this.boardList[dest])

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
                // Remove KS castling rights
                this.castlingRights |= 0b0010 << shift
            }
        }

        // Check if we're promoting
        let destinationPiece = piece

        if (move.isPromotion()) {
            destinationPiece = new Piece(piece.getColour() | move.getPromotionPiece())
        }

        // Add the piece in the square-oriented data structure. This will automatically take care of non-enpassant captures
        this.boardList[dest] = destinationPiece.datum
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

        this.sideToMoveIndex = +!this.sideToMoveIndex
        this.sideToMove = this.sideToMoveIndex ? Pieces.black : Pieces.white

    }

    unplayMove(move: Move) {
        // Remove the most recent gamestate
        const newGameState = this.pastGameStateStack.pop()

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


        let piece = new Piece(this.boardList[dest])
        const colourOffset = piece.isColour(Pieces.white) ? 0 : 56

        // Removed moved piece from data strucutures and replace it with an empty square or the captured piece
        this.boardList[dest] = pieceCapturedLastPly
        this.collections[piece.getType()][this.sideToMoveIndex].remove(dest)

        // Handle en passant
        if (move.isEnPassant()) {
            const enPassantOffset = piece.isColour(Pieces.white) ? -8 : 8

            this.boardList[dest + enPassantOffset] = Pieces.pawn | opponentColour
            this.collections[Pieces.pawn][opponentMoveIndex].add(dest + enPassantOffset)
        }
        else if (move.isPromotion()) {
            piece = new Piece(Pieces.pawn | this.sideToMove)
        }
        // KS castling
        else if (flag === 0b0010) {
            this.collections[Pieces.rook][this.sideToMoveIndex].remove(5 + colourOffset)
            this.collections[Pieces.rook][this.sideToMoveIndex].add(7 + colourOffset)

            this.boardList[5 + colourOffset] = Pieces.empty
            this.boardList[7 + colourOffset] = Pieces.rook | this.sideToMove
        }
        // QS castling
        else if (flag === 0b0011) {
            this.collections[Pieces.rook][this.sideToMoveIndex].remove(3 + colourOffset)
            this.collections[Pieces.rook][this.sideToMoveIndex].add(0 + colourOffset)

            this.boardList[3 + colourOffset] = Pieces.empty
            this.boardList[0 + colourOffset] = Pieces.rook | this.sideToMove
        }
        // Will also take care of promotion captures
        if (move.isCapture() && !move.isEnPassant()) {
            this.collections[pieceCapturedLastPly & 0b111][opponentMoveIndex].add(dest)
        }

        // Source square replace with the moved piece
        this.boardList[source] = piece.datum
        this.collections[piece.getType()][this.sideToMoveIndex].add(source)

        this.castlingRights = (newGameState & 0b111100000) >> 5
        this.pieceCapturedPlyBefore = (newGameState & 0b111000000000) >> 9
        this.epFile = (newGameState & 0b11110) >> 1
        this.updateAllPieceCollection()
    }

    getBoardData() {
        return this.getGameState() >> 1
    }
}

export default Board