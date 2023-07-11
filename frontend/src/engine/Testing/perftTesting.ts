import MoveGenerator from '../MoveGenerator'

function printBoard(board: Uint8Array) {
    let rows = []

    for (let i = 0; i < 8; i++) {
        let row = []
        for (let j = 0; j < 8; j++) {
            row.push(board[i * 8 + j])
        }
        rows.push(row)
    }
    rows.reverse()

    for (let i = 0; i < rows.length; i++) {
        console.log(rows[i].toString())
    }
    console.log('\n\n')
}
// Function implimentation copied from a function written in C
// https://www.chessprogramming.org/Perft
export function perft(depth: number, generator: MoveGenerator, callback: Function = () => { }) {
    const maxDepth = depth

    const cumNodes: Array<number> = [0]
    function testAtDepth(depth: number) {
        let moveList = []
        let nodes = 0

        if (depth == 0) {
            return 1
        }

        moveList = generator.generateLegalMoves()

        for (let i = 0; i < moveList.length; i++) {

            generator.board.playMove(moveList[i])
            nodes += testAtDepth(depth - 1)
            generator.board.unplayMove(moveList[i])

            if (depth == maxDepth) {
                // if (moveList[i].toLetterUCI() === "g7h6") {
                //     console.log(moveList[i].isPromotion())
                // }
                // console.log(`${moveList[i].toLetterUCI()}: ${nodes - (cumNodes.at(-1) as number)}`)
                cumNodes.push(nodes)
            }
            if (depth == maxDepth - 1) {
                // console.log(".")
            }
        }


        return nodes
    }
    const result = testAtDepth(depth)
    // console.log(`Total Nodes: ${result}`)
    // console.log(`Expected Nodes: 197281`)
    callback(result)
    return result
}
