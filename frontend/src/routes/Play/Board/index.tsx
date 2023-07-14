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
}

interface Props {
    mouseX: number;
    mouseY: number;
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
        }
    }

    componentDidMount(): void {
        const [board, sideToMove, boardData, moves] = getStartingPosition()

        this.setState({
            board: board,
            draggingPieceIndex: null,
            sideToMove: sideToMove,
            legalMoves: moves,
            boardData: boardData,
        })

        // setTimeout(() => this.opponentPlayMove(), 0)

    }


    attemptMove(from: number, to: number) {
        const [newBoard, sideToMove, boardData, moves] = tryToPlayMove(from, to, this.state.board, this.state.sideToMove, this.state.boardData)

        this.setState({
            board: newBoard,
            sideToMove: sideToMove,
            legalMoves: moves,
            boardData: boardData
        })

        setTimeout(() => this.opponentPlayMove(), 0)
    }

    opponentPlayMove() {
        const [newBoard, sideToMove, boardData, moves] = calculateBestMove(this.state.board, this.state.sideToMove, this.state.boardData)

        this.setState({
            board: newBoard,
            sideToMove: sideToMove,
            legalMoves: moves,
            boardData: boardData
        })
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
        const newIndex: number = (Math.round(7 - draggingPieceY)) * 8 + Math.round(draggingPieceX)

        const avaliableSquares = this.getAvaliableMovesFrom(this.state.draggingPieceIndex!)

        if (avaliableSquares.includes(newIndex)) {
            this.attemptMove(this.state.draggingPieceIndex!, newIndex)
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

            let colour: string = (row + column) % 2 === 0 ? initialColours.darkSquares : initialColours.lightSquares

            if (i == draggingPieceIndex) {
                colour = initialColours.activeSquare
            }
            else if (avaliableSquares.includes(i)) {
                colour = initialColours.allowedMove
            }


            const pieceStyles: React.CSSProperties = {
                zIndex: i === draggingPieceIndex ? 10 : 5,
                transform: i === draggingPieceIndex ? `translate(${(draggingPieceX) * 100}%, ${(draggingPieceY) * 100 - 700}%)` : `translate(${column * 100}%, ${-row * 100}%)`,
                width: squareLength,
                height: squareLength,
            }

            const squareStyles: React.CSSProperties = {
                backgroundColor: colour,
                width: squareLength,
                height: squareLength,
                gridRowStart: 8 - row,
            }

            squares.push(
                <div
                    key={i}
                    className="square"
                    style={squareStyles}
                >
                    <p className='testing-number'>{i}</p>
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

