import React from "react"
import { perft as syncPerft } from "./../../engine/Testing/perftTesting"
import Board from "./../../engine/Board"
import testPositions from "./positions"

import "./index.css"

const perft = (depth: number, board: Board): Promise<number> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const nodes = syncPerft(depth, board)
            resolve(nodes)
        }, 0)
    })
}


interface Props { }
interface State {
    results: Array<Array<number>>,
    startTime: number;
    ellapsedTime: number;
}

const depthBelowMax = 2

class TestingPage extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)

        this.startPerfTests = this.startPerfTests.bind(this)

        const results: Array<Array<number>> = testPositions.map((v) => {
            return new Array(v.expectedResults.length - depthBelowMax).fill(-1)
        })

        this.state = {
            results: results,
            ellapsedTime: -1,
            startTime: -1
        }
    }



    componentDidMount() {
        this.startPerfTests()
    }

    startPerfTests() {
        this.setState({
            startTime: Date.now(),
        })

        let promiseList = []

        let searchDepth = 1
        let searching = true

        while (searching) {
            searching = false

            for (let i = 0; i < testPositions.length; i++) {
                const maxDepth = testPositions[i].expectedResults.length - depthBelowMax

                if (searchDepth <= maxDepth) {
                    searching = true
                }
                else {
                    continue
                }

                const generator = new Board(testPositions[i].board, testPositions[i].gameState)

                const depth = searchDepth

                const promise = perft(depth, generator).then(nodes => {
                    const newResults = this.state.results
                    newResults[i][depth - 1] = nodes
                    this.setState({
                        results: newResults,
                    })
                })

                promiseList.push(promise)
            }

            searchDepth++
        }

        Promise.allSettled(promiseList).then(() => {
            this.setState({
                ellapsedTime: Date.now() - this.state.startTime
            })
        })
    }

    render() {
        const resultElements = []

        for (let i = 0; i < this.state.results.length; i++) {
            const depthMessages = this.state.results[i].map((result, j) => {
                if (result == -1) {
                    return (
                        <p className="result-message" key={j}>Depth {j + 1}: <span className="waiting">Calculating positions...</span></p>
                    )
                }
                else if (result === testPositions[i].expectedResults[j]) {
                    return (
                        <p className="result-message" key={j}>Depth {j + 1} - Nodes: {result}  <span className="passed"> Test Passed! - Expected value {testPositions[i].expectedResults[j]}</span></p>
                    )
                }
                else {
                    return (
                        <p className="result-message" key={j}>Depth {j + 1} - Nodes: {result}  <span className="failed"> Test Failed - Expected value {testPositions[i].expectedResults[j]}</span></p>
                    )
                }
            })
            resultElements.push(
                (
                    <div key={i} className="position-container">
                        <p className="title">{testPositions[i].name}</p>
                        {depthMessages}
                    </div>
                )
            )
        }

        const totalNodesSearched = this.state.results.flat().reduce((t, v) => t + v, 0);

        return (
            <div className="result-page">
                <div className="results">
                    {resultElements}
                </div>
                <div className="page-title">
                    Performance Testing
                </div>
                <div className="time">
                    {this.state.ellapsedTime === -1 ? "" : `${this.state.ellapsedTime / 1000} seconds ellapsed KN/s = ${Math.round(totalNodesSearched / (this.state.ellapsedTime))}`}
                </div>
            </div>
        )
    }
}

export default TestingPage