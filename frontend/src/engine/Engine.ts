import Board from './Board'
import Move, { Pieces } from './Move'
import Search from './Search'
import { StartingBoard } from './constants'
import { PieceSquareTables } from './constants'

export interface Customisation {
    depth: number
    aggressiveness: number,
    tradeHappy: number
    positionalPlay: number
    blindSpots: number
}

export const defaultCustomisation: Customisation = {
    depth: 3,
    positionalPlay: 100,
    aggressiveness: 50,
    tradeHappy: 50,
    blindSpots: 0
}

export type PieceSquareTable = Array<{ [key: number]: Array<number> }>

class Engine {
    board: Board
    customisation: Customisation
    pieceSquareTables: PieceSquareTable
    moveHistory: Move[]


    static fromStartingPosition(customisation: Customisation = defaultCustomisation) {
        const board = new Board(StartingBoard, 0x000)
        return new this(board, customisation)
    }

    constructor(board: Board, customisation: Customisation = defaultCustomisation, moveHistory = []) {
        this.board = board
        this.customisation = customisation
        this.moveHistory = moveHistory

        let purePieceSquareTables: PieceSquareTable = [{}, PieceSquareTables]

        for (let i = 0; i < Object.keys(PieceSquareTables).length; i++) {
            const table = PieceSquareTables[i + 1]

            let reversedTable = []

            for (let j = 0; j < table.length; j++) {
                reversedTable.push(table[table.length - 1 - j])
            }

            purePieceSquareTables[0][i + 1] = reversedTable
        }

        this.pieceSquareTables = this.addNormalNoise(purePieceSquareTables)
    }

    setAggression(sideTobeAggressive: number): void {
        // Add aggression for own table only
        const tableIndex: number = sideTobeAggressive === Pieces.white ? 0 : 1

        for (const key in this.pieceSquareTables[tableIndex]) {
            this.pieceSquareTables[tableIndex][key] = this.pieceSquareTables[tableIndex][key]
                .map((value, index) => {
                    return value + Math.floor(sideTobeAggressive ? (index / 8) : (63 - index / 8)) * ((this.customisation.aggressiveness - 50) / 100) * 20
                })
        }
    }

    addNormalNoise(tables: PieceSquareTable): PieceSquareTable {
        // We will add normally distributed noise to each table depending on the positionalPlay value

        // Get a random number in the range (-∞,∞) distributed N(0,1)
        const StandardNormalSample = () => {
            const u1 = Math.random()
            const u2 = Math.random()

            // Use the Box-Muller Transform, which is bijection from [0,1]^2 to (-∞,∞) with a standard normal distribution
            // https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform
            return Math.sqrt(-2 * Math.log(u1)) * Math.cos(u2 * 2 * Math.PI)
        }

        // If this.customisation.positionalPlay is 100 then variance = 0 so no noise should be added
        if (this.customisation.positionalPlay === 100) {
            return tables
        }

        // When strength == 0, an addition of 50 noise should only happen in 1% of cases
        // So if X - N(0, variance_max) then P(x > 50) = 0.01
        // (X - u)/sd = Z 
        // 50/sd_max = 2.3263 (from a level maths formula booklet)
        // sd_max = 50/2.3263 = 21.49 
        // We'll say sd_max should be about 25 for the weakest engine
        // f: [0, 100) -> (0, 25]
        // We'll choose a inverse linear relationship between strength and standard deviation, so f(x) = 25 - x/4
        const standard_deviation = 25 - this.customisation.positionalPlay / 4

        tables.forEach(table => {
            for (const key in table) {
                table[key] = table[key].map(value => {
                    return value + (StandardNormalSample() * standard_deviation)
                })
            }
        })

        return tables
    }


    getBestMove(): Move {
        return Search(this.board, this.customisation, this.pieceSquareTables)
    }

    async computerMove(): Promise<Move> {
        return new Promise((resolve) => {
            setTimeout(() => {
                const move = this.getBestMove()
                this.board.playMove(move)
                this.moveHistory.push(move)
                resolve(move)
            }, 20)
        })
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