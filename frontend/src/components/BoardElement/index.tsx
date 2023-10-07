import React from "react";
import Move from "../../engine/Move";
import Board from "../../engine/Board";
import { Pieces, squareLength, initialColours } from "./constants"
import Piece from "./Piece";

import "./index.css"

interface State {
    draggingPieceIndex: number | null; // Index of the board square of the piece that is being picked up

}

interface Props {
    board: Board
    onUserAttemptsMove: (from: number, to: number) => void
    mouseX: number,
    mouseY: number,
    sideFacingForward: number,
    lastMove: Move | null,

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


class BoardElement extends React.Component<Props, State> {
    boardRef: React.RefObject<HTMLDivElement>

    constructor(props: Props) {
        super(props)

        this.boardRef = React.createRef()

        this.state = {
            draggingPieceIndex: null
        }

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

    getAvaliableMovesFrom(from: number): number[] {
        const legalMovesForPiece: Move[] = this.props.board.generateLegalMoves()
            .filter(move => move.getSourceSquare() === from)

        return legalMovesForPiece.map(move => move.getDestinationSquare())
    }


    handleMouseUp = () => {
        const { draggingPieceX, draggingPieceY } = this.getDraggingPieceOffsets(this.props.mouseX, this.props.mouseY, this.state.draggingPieceIndex!)

        const newIndex: number = (Math.round(draggingPieceY)) * 8 + 7 - Math.round(draggingPieceX)

        const translatedNewIndex = this.props.sideFacingForward === Pieces.white ? (63 - newIndex) : newIndex

        const avaliableSquares = this.getAvaliableMovesFrom(this.state.draggingPieceIndex!)

        if (avaliableSquares.includes(translatedNewIndex)) {
            this.props.onUserAttemptsMove(this.state.draggingPieceIndex!, translatedNewIndex)
        }

        this.setState({ draggingPieceIndex: null })
    }


    render() {
        const { draggingPieceIndex } = this.state;
        const { draggingPieceX, draggingPieceY } = this.getDraggingPieceOffsets(this.props.mouseX, this.props.mouseY, draggingPieceIndex)

        // If we are dragging a piece
        let avaliableSquares: number[] = draggingPieceIndex === null ? [] : this.getAvaliableMovesFrom(draggingPieceIndex)

        const squares: JSX.Element[] = []
        const squareMasks: JSX.Element[] = []
        const pieces: JSX.Element[] = []

        for (let i = 0; i < 64; i++) {
            const row: number = Math.floor(i / 8)
            const column: number = i % 8

            let colour: string = (row + column) % 2 === (this.props.sideFacingForward === Pieces.white ? 0 : 1) ? initialColours.darkSquares : initialColours.lightSquares
            const translatedIndex = this.props.sideFacingForward === Pieces.white ? i : (row * 8 + 7 - column)

            let colourMask = "#00000000"

            if (this.props.lastMove && translatedIndex) {
                if (this.props.lastMove.getDestinationSquare() === translatedIndex) {
                    colourMask = initialColours.lastMoveDestination
                }
                else if (this.props.lastMove.getSourceSquare() === translatedIndex) {
                    colourMask = initialColours.lastMoveSource
                }
            }
            if (translatedIndex == draggingPieceIndex) {
                colourMask = initialColours.activeSquare
            }
            else if (avaliableSquares.includes(translatedIndex)) {
                colourMask = initialColours.allowedMove
            }


            const pieceStyles: React.CSSProperties = {
                zIndex: i === draggingPieceIndex ? 10 : 5,
                transform: pieceTranslation(i == draggingPieceIndex, this.props.sideFacingForward, draggingPieceX, draggingPieceY, column, row),
                width: squareLength,
                height: squareLength,
            }

            pieceStyles[this.props.sideFacingForward === Pieces.white ? "bottom" : "top"] = 0

            const squareStyles: React.CSSProperties = {
                backgroundColor: colour,
                width: squareLength,
                height: squareLength,
            }

            const squareMaskStyles: React.CSSProperties = {
                backgroundColor: colourMask,
                width: squareLength,
                height: squareLength,
            }

            if (this.props.sideFacingForward === Pieces.white) {
                squareStyles.gridRowStart = 8 - row
                squareMaskStyles.gridRowStart = 8 - row
            }

            squares.push(
                <div
                    key={i}
                    className="square"
                    style={squareStyles}
                ></div>
            )

            squareMasks.push(
                <div
                    key={i}
                    className="square-mask"
                    style={squareMaskStyles}
                ></div>
            )


            let pieceNumericValue = this.props.board.getSquares()[i].datum

            if (pieceNumericValue !== 0) { // not empty
                pieces.push(
                    <Piece
                        piece={pieceNumericValue}
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
                <div className="square-masks" draggable="false">
                    {squareMasks}
                </div>
                {pieces}
            </div>
        )
    }
}


export default BoardElement