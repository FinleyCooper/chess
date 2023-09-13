import { Pieces } from "../../engine/Move"

interface TestPosition {
    name: string;
    board: Uint8Array;
    gameState: number;
    expectedResults: Array<number>;
}

const StartingPosition = new Uint8Array([
    Pieces.white | Pieces.rook,
    Pieces.white | Pieces.knight,
    Pieces.white | Pieces.bishop,
    Pieces.white | Pieces.queen,
    Pieces.white | Pieces.king,
    Pieces.white | Pieces.bishop,
    Pieces.white | Pieces.knight,
    Pieces.white | Pieces.rook,
    ...(new Array(8).fill(Pieces.white | Pieces.pawn)),
    ...(new Array(32).fill(Pieces.empty)),
    ...(new Array(8).fill(Pieces.black | Pieces.pawn)),
    Pieces.black | Pieces.rook,
    Pieces.black | Pieces.knight,
    Pieces.black | Pieces.bishop,
    Pieces.black | Pieces.queen,
    Pieces.black | Pieces.king,
    Pieces.black | Pieces.bishop,
    Pieces.black | Pieces.knight,
    Pieces.black | Pieces.rook,
])

const CastlingAndPromotion = new Uint8Array([
    Pieces.white | Pieces.rook,
    Pieces.empty,
    Pieces.empty,
    Pieces.white | Pieces.queen,
    Pieces.empty,
    Pieces.rook | Pieces.white,
    Pieces.king | Pieces.white,
    Pieces.empty,
    Pieces.pawn | Pieces.white,
    Pieces.pawn | Pieces.black,
    Pieces.empty,
    Pieces.pawn | Pieces.white,
    Pieces.empty,
    Pieces.empty,
    Pieces.pawn | Pieces.white,
    Pieces.pawn | Pieces.white,
    Pieces.queen | Pieces.black,
    ...(new Array(4).fill(Pieces.empty)),
    Pieces.knight | Pieces.white,
    Pieces.empty,
    Pieces.empty,
    Pieces.bishop | Pieces.white,
    Pieces.bishop | Pieces.white,
    Pieces.pawn | Pieces.white,
    Pieces.empty,
    Pieces.pawn | Pieces.white,
    ...(new Array(3).fill(Pieces.empty)),
    Pieces.knight | Pieces.black,
    Pieces.pawn | Pieces.white,
    ...(new Array(7).fill(Pieces.empty)),
    Pieces.bishop | Pieces.black,
    ...(new Array(3).fill(Pieces.empty)),
    Pieces.knight | Pieces.black,
    Pieces.bishop | Pieces.black,
    Pieces.knight | Pieces.white,
    Pieces.pawn | Pieces.white,
    ...(new Array(3).fill(Pieces.black | Pieces.pawn)),
    Pieces.empty,
    ...(new Array(3).fill(Pieces.black | Pieces.pawn)),
    Pieces.rook | Pieces.black,
    ...(new Array(3).fill(Pieces.empty)),
    Pieces.king | Pieces.black,
    ...(new Array(2).fill(Pieces.empty)),
    Pieces.rook | Pieces.black,
])

const EndgamePins = new Uint8Array([
    ...(new Array(12).fill(Pieces.empty)),
    Pieces.pawn | Pieces.white,
    Pieces.empty,
    Pieces.pawn | Pieces.white,
    ...(new Array(10).fill(Pieces.empty)),
    Pieces.rook | Pieces.white,
    ...(new Array(3).fill(Pieces.empty)),
    Pieces.pawn | Pieces.black,
    Pieces.empty,
    Pieces.king | Pieces.black,
    Pieces.king | Pieces.white,
    Pieces.pawn | Pieces.white,
    ...(new Array(5).fill(Pieces.empty)),
    Pieces.rook | Pieces.black,
    ...(new Array(3).fill(Pieces.empty)),
    Pieces.pawn | Pieces.black,
    ...(new Array(6).fill(Pieces.empty)),
    Pieces.pawn | Pieces.black,
    ...(new Array(13).fill(Pieces.empty)),
])

const Talkchess = new Uint8Array([
    Pieces.white | Pieces.rook,
    Pieces.white | Pieces.knight,
    Pieces.white | Pieces.bishop,
    Pieces.white | Pieces.queen,
    Pieces.white | Pieces.king,
    Pieces.empty,
    Pieces.empty,
    Pieces.white | Pieces.rook,
    ...(new Array(3).fill(Pieces.white | Pieces.pawn)),
    Pieces.empty,
    Pieces.white | Pieces.knight,
    Pieces.black | Pieces.knight,
    ...(new Array(2).fill(Pieces.white | Pieces.pawn)),
    ...(new Array(10).fill(Pieces.empty)),
    Pieces.white | Pieces.bishop,
    ...(new Array(15).fill(Pieces.empty)),
    Pieces.black | Pieces.pawn,
    ...(new Array(5).fill(Pieces.empty)),
    ...(new Array(2).fill(Pieces.black | Pieces.pawn)),
    Pieces.empty,
    Pieces.white | Pieces.pawn,
    Pieces.black | Pieces.bishop,
    ...(new Array(3).fill(Pieces.black | Pieces.pawn)),
    Pieces.black | Pieces.rook,
    Pieces.black | Pieces.knight,
    Pieces.black | Pieces.bishop,
    Pieces.black | Pieces.queen,
    Pieces.empty,
    Pieces.black | Pieces.king,
    Pieces.empty,
    Pieces.black | Pieces.rook,
])

const testPositions: Array<TestPosition> = [
    {
        name: "Starting Position",
        board: StartingPosition,
        gameState: 0b000000000,
        expectedResults: [20, 400, 8902, 197281, 4865609, 119060324]
    },
    {
        name: "Castling and Promotion",
        board: CastlingAndPromotion,
        gameState: 0b001100000,
        expectedResults: [6, 264, 9467, 422333, 15833292, 706045033]
    },
    {
        name: "Endgame Pins",
        board: EndgamePins,
        gameState: 0b111100000,
        expectedResults: [14, 191, 2812, 43238, 674624, 11030083, 178633661]
    },
    {
        name: "Talkchess Position",
        board: Talkchess,
        gameState: 0b110000000,
        expectedResults: [44, 1486, 62379, 2103487, 89941194]
    },
]

export default testPositions