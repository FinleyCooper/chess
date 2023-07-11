const distancesFromEdge = new Map()

for (let i = 0; i < 64; i++) {
    const file = i % 8
    const rank = Math.floor(i / 8)

    let distanceFromTop = 7 - rank
    let distanceFromBottom = rank
    let distanceFromLeft = file
    let distanceFromRight = 7 - file

    // Corresponding to these offsets [-1, 7, 8, 9, 1, -7, -8, -9]
    distancesFromEdge.set(i, [
        distanceFromLeft,
        Math.min(distanceFromLeft, distanceFromTop),
        distanceFromTop,
        Math.min(distanceFromTop, distanceFromRight),
        distanceFromRight,
        Math.min(distanceFromBottom, distanceFromRight),
        distanceFromBottom,
        Math.min(distanceFromBottom, distanceFromLeft)
    ])
}

const serialisedDistances = JSON.stringify(Array.from(distancesFromEdge.entries()))

console.log(serialisedDistances)
