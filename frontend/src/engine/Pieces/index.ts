import Bishop from "./Bishop";
import King from "./King";
import Knight from "./Knight";
import Pawn from "./Pawn";
import Queen from "./Queen";
import Rook from "./Rook";
import Empty from "./Empty";
import { Pieces } from "../constants";
import BasePiece from "./BasePiece";

function getPieceFromBinary(datum: number): BasePiece {
    const colour = datum & 0b11000

    switch (datum & 0b00111) {
        case Pieces.pawn:
            return new Pawn(colour)
        case Pieces.rook:
            return new Rook(colour)
        case Pieces.knight:
            return new Knight(colour)
        case Pieces.bishop:
            return new Bishop(colour)
        case Pieces.queen:
            return new Queen(colour)
        case Pieces.king:
            return new King(colour)
        default:
            return new Empty()
    }

}


export default {
    Bishop,
    King,
    Knight,
    Pawn,
    Queen,
    Rook,
    Empty,
    FromBinary: getPieceFromBinary
};