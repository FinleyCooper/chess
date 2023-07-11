// Knight offsets
const offsets = [
    { offset: -10, disallowedFiles: [0, 1], disallowedRanks: [0] },
    { offset: -17, disallowedFiles: [0], disallowedRanks: [0, 1] },
    { offset: -15, disallowedFiles: [7], disallowedRanks: [0, 1] },
    { offset: -6, disallowedFiles: [6, 7], disallowedRanks: [0] },
    { offset: 6, disallowedFiles: [0, 1], disallowedRanks: [7] },
    { offset: 15, disallowedFiles: [0], disallowedRanks: [6, 7] },
    { offset: 17, disallowedFiles: [7], disallowedRanks: [6, 7] },
    { offset: 10, disallowedFiles: [6, 7], disallowedRanks: [7] },
]

const moves = new Map()

for (let i = 0; i < 64; i++) {
    const file = i % 8
    const rank = Math.floor(i / 8)

    const movesFromSquare = []

    for (let j = 0; j < offsets.length; j++) {
        if (offsets[j].disallowedFiles.includes(file) || offsets[j].disallowedRanks.includes(rank)) {
            continue
        }

        const targetSquare = i + offsets[j].offset

        movesFromSquare.push(targetSquare)

    }

    moves.set(i, movesFromSquare)
}

const serialisedMoves = JSON.stringify(Array.from(moves.entries()))

console.log(serialisedMoves)
