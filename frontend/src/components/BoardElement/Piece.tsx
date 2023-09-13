import React from "react"
import { Pieces } from "./constants"
import pieceSVGs from "./pieces.svg"


interface PieceProps {
    piece: number;
    style?: React.CSSProperties;
    onMouseDown?: (event: React.MouseEvent) => void;
    onMouseMove?: (event: React.MouseEvent) => void;
    onMouseUp?: () => void;
}


class Piece extends React.Component<PieceProps> {
    constructor(props: PieceProps) {
        super(props)
    }

    render() {
        const { piece, style, onMouseDown, onMouseMove, onMouseUp } = this.props

        const colour: string = piece & Pieces.white ? "white" : "black"

        let type: string = ""

        switch (piece & 7) {
            case Pieces.pawn:
                type = "pawn"
                break
            case Pieces.rook:
                type = "rook"
                break
            case Pieces.knight:
                type = "knight"
                break
            case Pieces.bishop:
                type = "bishop"
                break
            case Pieces.queen:
                type = "queen"
                break
            case Pieces.king:
                type = "king"
                break
        }

        return (
            <svg className="chess-piece" style={style} onMouseDown={onMouseDown} onMouseUp={onMouseUp} onMouseMove={onMouseMove}>
                <use href={`${pieceSVGs}#${colour}-${type}`} />
            </svg>
        )
    }
}

export default Piece