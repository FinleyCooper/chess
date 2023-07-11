import BasePiece from "./BasePiece";
import { Pieces } from "../constants";
import Board from "../Board";
import { generateSliderMoves, getSlidingPieceAttacks } from "./utils";
import Move from "../Move";


class Bishop extends BasePiece {
    constructor(colour: number) {
        super(colour | Pieces.bishop)
    }

    public override getAttacks(square: number, blockers: bigint) {
        return getSlidingPieceAttacks(square, [7, 9, -7, -9], blockers)
    }

    public override getLegalMoves(square: number, board: Board): Array<Move> {
        return generateSliderMoves(square, this.getColour(), [7, 9, -7, -9], board)
    }
}

export default Bishop