import BasePiece from "./BasePiece";
import { Pieces } from "../constants";
import Board from "../Board";
import { generateSliderMoves, getSlidingPieceAttacks } from "./utils";
import Move from "../Move";


class Queen extends BasePiece {
    constructor(colour: number) {
        super(colour | Pieces.queen)
    }

    public override getAttacks(square: number, blockers: bigint) {
        return getSlidingPieceAttacks(square, [-1, 7, 8, 9, 1, -7, -8, -9], blockers)

    }

    public override getLegalMoves(square: number, board: Board): Array<Move> {
        return generateSliderMoves(square, this.getColour(), [-1, 7, 8, 9, 1, -7, -8, -9], board)
    }
}

export default Queen