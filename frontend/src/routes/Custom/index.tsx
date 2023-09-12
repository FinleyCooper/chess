import React from 'react'
import pieceSVGs from "./../Play/Board/pieces.svg"
import { Pieces } from '../Play/Board/constants'
import Board from '../Play/Board'
import { LoggedInContext } from '../../LoggedInContext'

import "./index.css"

interface Props { }
interface State {
    playingAs: number
    submitted: boolean
    mouseX: number;
    mouseY: number;
}

class Custom extends React.Component<Props, State> {
    static contextType = LoggedInContext
    declare context: React.ContextType<typeof LoggedInContext>

    constructor(props: Props) {
        super(props)

        this.gameFinished = this.gameFinished.bind(this)

        this.state = {
            playingAs: 0,
            submitted: false,
            mouseX: 0,
            mouseY: 0,
        }
    }

    handleMouseMove = (event: React.MouseEvent) => {
        this.setState({
            mouseX: event.clientX,
            mouseY: event.clientY,
        })
    }

    gameFinished(gameResult: string, moveList: string, winner: number) {
        fetch(`/api/users/${this.context.id}/games`, {
            headers: {
                "content-type": "application/json"
            },
            method: "POST",
            body: JSON.stringify({
                moveList: moveList,
                gameResult: gameResult,
                customSettings: {},
                humanPlaysAs: this.state.playingAs,
                winner: winner,
            })
        })
    }

    render() {
        return this.state.submitted ? (
            <div className="page-content" onMouseMove={this.handleMouseMove}>
                <div className="board-container">
                    <Board onGameFinished={this.gameFinished} humanPlaysAs={this.state.playingAs} mouseX={this.state.mouseX} mouseY={this.state.mouseY} />
                </div>
            </div>
        ) :
            (
                <div className="customisation-container">
                    <div className="customisation-option-container">
                        <div className={`customisation-option${this.state.playingAs === Pieces.white ? " active" : ""}`} onClick={() => this.setState({ playingAs: Pieces.white })}>
                            <p className="customisation-option-title">Play as White</p>
                            <svg className="customisation-option-icon" viewBox='0 0 100 100'>
                                <use href={`${pieceSVGs}#white-king`} />
                            </svg>
                        </div>
                        <div className={`customisation-option${this.state.playingAs === Pieces.black ? " active" : ""}`} onClick={() => this.setState({ playingAs: Pieces.black })}>
                            <p className="customisation-option-title">Play as Black</p>
                            <svg className="customisation-option-icon" viewBox='0 0 100 100'>
                                <use href={`${pieceSVGs}#black-king`} />
                            </svg>
                        </div>
                    </div>
                    <div className="submit-container" onClick={() => this.setState({ submitted: true })}>
                        <p>Play</p>
                    </div>
                </div>
            )
    }
}

export default Custom