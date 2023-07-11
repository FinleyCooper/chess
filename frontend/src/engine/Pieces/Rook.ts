import BasePiece from "./BasePiece";
import { Pieces } from "../constants";
import Board from "../Board";
import { generateSliderMoves, getSlidingPieceAttacks } from "./utils";
import Move from "../Move";


class Rook extends BasePiece {
    constructor(colour: number) {
        super(colour | Pieces.rook)
    }

    public override getAttacks(square: number, blockers: bigint) {
        return getSlidingPieceAttacks(square, [-1, 8, 1, -8], blockers)

    }

    public override getLegalMoves(square: number, board: Board): Array<Move> {
        return generateSliderMoves(square, this.getColour(), [-1, 8, 1, -8], board)
    }
}

export default Rook