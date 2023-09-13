import Board from './Board'
import Move from './Move'
import Search from './Search'
import { StartingBoard, Pieces } from './constants'

export interface Customisation {
    strength: number
    aggressiveness: number,
    tradeHappy: number
}

export const defaultCustomisation: Customisation = {
    strength: 100,
    aggressiveness: 50,
    tradeHappy: 50
}


class Engine {
    board: Board
    depth: number
    customisation: Customisation
    moveHistory: Move[]

    static fromStartingPosition(depth: number = 3, customisation: Customisation = defaultCustomisation) {
        const board = new Board(StartingBoard, 0x000)
        return new this(board, depth, customisation)
    }

    constructor(board: Board, depth: number = 3, customisation: Customisation = defaultCustomisation, moveHistory = []) {
        this.board = board
        this.depth = depth
        this.customisation = customisation
        this.moveHistory = moveHistory
    }

    getBestMove(): Move {
        return Search(this.board, this.depth)
    }

    computerMove(): Move {
        const move = this.getBestMove()
        this.board.playMove(move)
        this.moveHistory.push(move)
        return move
    }

    playerMove(move: Move): Move {
        this.board.playMove(move)
        this.moveHistory.push(move)
        return move
    }

    playerUCIMove(from: number, to: number): Move {
        const move = this.board.playUCIMove(from, to)
        this.moveHistory.push(move)

        return move
    }

    getMoveListString(): string {
        return this.moveHistory.reduce((moveString, currMove) => {
            return moveString += `${decToCoord(currMove.getSourceSquare())}${decToCoord(currMove.getDestinationSquare())} `
        }, "").slice(0, -1) // Remove extra space at the end
    }

    static moveHistoryStringToUCI(string: string): number[][] {
        return string.split(" ").map(move => {
            const sourceSquare = move.slice(0, 2)
            const destSquare = move.slice(-2)

            return [coordTodec(sourceSquare), coordTodec(destSquare)]
        })
    }
}

function coordTodec(coord: string): number {
    const file = coord.charCodeAt(0) - 97
    const rank = Number(coord[1]) - 1

    return rank * 8 + file
}

function decToCoord(square: number): string {
    return `${String.fromCharCode(97 + (square % 8))}${Math.floor(square / 8) + 1}`
}

export default Engine