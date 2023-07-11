import MoveGenerator from '../MoveGenerator'

// Function implimentation copied from a function written in C
// https://www.chessprogramming.org/Perft
export function perft(depth: number, generator: MoveGenerator) {
    const maxDepth = depth

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
        }


        return nodes
    }
    const result = testAtDepth(depth)
    return result
}
