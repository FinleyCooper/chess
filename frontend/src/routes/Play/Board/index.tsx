import React from "react"
import Piece from "./Piece"
import { calculateBestMove, getStartingPosition, tryToPlayMove } from "../../../engine"
import { Pieces, squareLength, initialColours } from "./constants"

import "./index.css"

// CHANGE : ADD REACT STRICTNESS BACK ONCE COMPUTER IS IMP.

interface State {
    draggingPieceIndex: number | null; // Index of the board square of the piece that is being picked up
    legalMoves: Uint16Array; // Array of Moves the lower 6 bits are used for source square, 6 after are used for destination square
    board: Uint8Array;  // Binary representation of the board
    sideToMove: number; // Side to move: 16 for White and 8 for Black
    boardData: number;  // Data needed for the state of the boar: not required to be read/written to by the GUI.
    isCheck: boolean;
    moveList: string[]; // List of moves
    gameFinished: boolean;
}

type GameFinished = (gameResult: string, moveList: string, winner: number) => void;

interface Props {
    onGameFinished: GameFinished;
    mouseX: number;
    mouseY: number;
    humanPlaysAs: number;
}

function pieceTranslation(isDragging: boolean, humanPlaysAs: number, dragX: number, dragY: number, col: number, row: number) {
    if (isDragging) {
        if (humanPlaysAs === Pieces.white) {
            return `translate(${(dragX) * 100}%, ${(dragY) * 100 - 700}%)`
        }
        else {
            return `translate(${(dragX) * 100}%, ${(dragY) * 100}%)`
        }
    }
    if (humanPlaysAs === Pieces.white) {
        return `translate(${col * 100}%, ${-row * 100}%)`
    }
    else {
        return `translate(${700 - col * 100}%, ${row * 100}%)`
    }
}


class Board extends React.Component<Props, State> {
    boardRef: React.RefObject<HTMLDivElement>

    constructor(props: Props) {
        super(props)

        this.boardRef = React.createRef()

        this.state = {
            board: new Uint8Array(Array(64).fill(Pieces.empty)),
            draggingPieceIndex: null,
            sideToMove: -1,
            legalMoves: new Uint16Array(),
            boardData: -1,
            isCheck: false,
            moveList: [],
            gameFinished: false
        }
    }

    componentDidMount(): void {
        const [board, sideToMove, boardData, moves, isCheck, move] = getStartingPosition(this.props.humanPlaysAs)

        this.setState({
            board: board,
            sideToMove: sideToMove,
            legalMoves: moves,
            boardData: boardData,
            isCheck: isCheck,
            moveList: [move]
        })
    }


    attemptMove(from: number, to: number) {
        const [newBoard, sideToMove, boardData, moves, isCheck, move] = tryToPlayMove(from, to, this.state.board, this.state.sideToMove, this.state.boardData)

        if (moves.length === 0) {
            this.props.onGameFinished(isCheck ? "Checkmate" : "Draw", [...this.state.moveList, move].join(" "), this.state.sideToMove)
        }

        this.setState(oldState => ({
            board: newBoard,
            sideToMove: sideToMove,
            legalMoves: moves,
            boardData: boardData,
            isCheck: isCheck,
            moveList: [...oldState.moveList, move]
        }))

        setTimeout(() => this.opponentPlayMove(), 5)
    }

    opponentPlayMove() {
        const [newBoard, sideToMove, boardData, moves, isCheck, move] = calculateBestMove(this.state.board, this.state.sideToMove, this.state.boardData)

        if (moves.length === 0) {
            this.props.onGameFinished(isCheck ? "Checkmate" : "Draw", [...this.state.moveList, move].join(" "), this.state.sideToMove)
        }

        this.setState(oldState => ({
            board: newBoard,
            sideToMove: sideToMove,
            legalMoves: moves,
            boardData: boardData,
            isCheck: isCheck,
            moveList: [...oldState.moveList, move]
        }))
    }


    getDraggingPieceOffsets = (mouseX: number, mouseY: number, draggingPieceIndex: number | null) => {
        if (draggingPieceIndex !== null && this.boardRef.current) {
            const boardRect: DOMRect = this.boardRef.current.getBoundingClientRect()

            const xOffset: number = Math.min(Math.max(mouseX - boardRect.x, 0), boardRect.width)
            const yOffset: number = Math.min(Math.max(mouseY - boardRect.y, 0), boardRect.height)

            const draggingPieceX: number = xOffset / (squareLength) - 0.005 * (squareLength)
            const draggingPieceY: number = yOffset / (squareLength) - 0.005 * (squareLength)

            return { draggingPieceX, draggingPieceY }
        }

        return { draggingPieceX: 0, draggingPieceY: 0 }
    }

    handleMouseDown = (_: React.MouseEvent, index: number) => {
        this.setState({ draggingPieceIndex: index })
    }

    handleMouseUp = () => {
        const { draggingPieceX, draggingPieceY } = this.getDraggingPieceOffsets(this.props.mouseX, this.props.mouseY, this.state.draggingPieceIndex!)

        const newIndex: number = (Math.round(draggingPieceY)) * 8 + 7 - Math.round(draggingPieceX)

        const translatedNewIndex = this.props.humanPlaysAs === Pieces.white ? (63 - newIndex) : newIndex

        const avaliableSquares = this.getAvaliableMovesFrom(this.state.draggingPieceIndex!)

        if (avaliableSquares.includes(translatedNewIndex)) {
            this.attemptMove(this.state.draggingPieceIndex!, translatedNewIndex)
        }
        else {
        }

        this.setState({ draggingPieceIndex: null })
    }

    getAvaliableMovesFrom(from: number) {
        const legalMovesForPiece: Uint16Array = this.state.legalMoves.filter(move => (move & 0x3F) == from)

        return legalMovesForPiece.map(move => move >> 6)
    }

    render() {
        const { board, draggingPieceIndex } = this.state;
        const { draggingPieceX, draggingPieceY } = this.getDraggingPieceOffsets(this.props.mouseX, this.props.mouseY, draggingPieceIndex)


        let avaliableSquares: Uint16Array = new Uint16Array()

        // If we are dragging a piece
        if (draggingPieceIndex !== null) {
            avaliableSquares = this.getAvaliableMovesFrom(draggingPieceIndex)
        }


        const squares: JSX.Element[] = []
        const pieces: JSX.Element[] = []

        for (let i = 0; i < board.length; i++) {
            const row: number = Math.floor(i / 8)
            const column: number = i % 8

            let colour: string = (row + column) % 2 === (this.props.humanPlaysAs === Pieces.white ? 0 : 1) ? initialColours.darkSquares : initialColours.lightSquares
            const translatedIndex = this.props.humanPlaysAs === Pieces.white ? i : (row * 8 + 7 - column)

            if (translatedIndex == draggingPieceIndex) {
                colour = initialColours.activeSquare
            }
            else if (avaliableSquares.includes(translatedIndex)) {
                colour = initialColours.allowedMove
            }


            const pieceStyles: React.CSSProperties = {
                zIndex: i === draggingPieceIndex ? 10 : 5,
                transform: pieceTranslation(i == draggingPieceIndex, this.props.humanPlaysAs, draggingPieceX, draggingPieceY, column, row),
                width: squareLength,
                height: squareLength,
            }

            pieceStyles[this.props.humanPlaysAs === Pieces.white ? "bottom" : "top"] = 0

            const squareStyles: React.CSSProperties = {
                backgroundColor: colour,
                width: squareLength,
                height: squareLength,
            }

            if (this.props.humanPlaysAs === Pieces.white) {
                squareStyles.gridRowStart = 8 - row
            }

            squares.push(
                <div
                    key={i}
                    className="square"
                    style={squareStyles}
                >
                </div>
            )

            if (board[i] !== Pieces.empty) {
                pieces.push(
                    <Piece
                        piece={board[i]}
                        style={pieceStyles}
                        key={i}
                        onMouseDown={(event: React.MouseEvent) => this.handleMouseDown(event, i)}
                        onMouseUp={this.handleMouseUp}
                    />
                )
            }
        }

        return (
            <div className="board" ref={this.boardRef}>
                <div className="squares" draggable="false">
                    {squares}
                </div>
                {pieces}
            </div>
        )
    }

}

export default Board

