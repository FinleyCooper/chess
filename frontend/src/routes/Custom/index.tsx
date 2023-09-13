import React from 'react'
import pieceSVGs from "../../components/BoardElement/pieces.svg"
import BoardElement from '../../components/BoardElement'
import { Pieces } from '../../components/BoardElement/constants'
import { LoggedInContext } from '../../LoggedInContext'
import Engine from "../../engine"
import { Customisation, defaultCustomisation } from '../../engine/Engine'
import CustomisationSlider from './CustomisationSlider'

import "./index.css"

interface Props { }
interface State {
    playingAs: number
    submitted: boolean
    mouseX: number
    mouseY: number
    customisation: Customisation
}

class Custom extends React.Component<Props, State> {
    static contextType = LoggedInContext
    declare context: React.ContextType<typeof LoggedInContext>
    Engine: Engine | null

    constructor(props: Props) {
        super(props)

        this.postGameResult = this.postGameResult.bind(this)
        this.startGame = this.startGame.bind(this)
        this.userMoves = this.userMoves.bind(this)
        this.checkResult = this.checkResult.bind(this)
        this.handleSliderChange = this.handleSliderChange.bind(this)

        this.state = {
            playingAs: 0,
            submitted: false,
            mouseX: 0,
            mouseY: 0,
            customisation: defaultCustomisation,
        }

        this.Engine = null

    }

    handleMouseMove = (event: React.MouseEvent) => {
        this.setState({
            mouseX: event.clientX,
            mouseY: event.clientY,
        })
    }

    postGameResult(gameResult: string, winner: number) {
        fetch(`/api/users/${this.context.id}/games`, {
            headers: {
                "content-type": "application/json"
            },
            method: "POST",
            body: JSON.stringify({
                moveList: this.Engine?.getMoveListString(),
                gameResult: gameResult,
                customSettings: {},
                humanPlaysAs: this.state.playingAs,
                winner: winner,
            })
        })
    }

    startGame() {
        if (this.state.playingAs == 0) {
            return
        }
        this.setState({ submitted: true })

        this.Engine = Engine.fromStartingPosition(3, defaultCustomisation)

        if (this.state.playingAs === Pieces.black) {
            this.Engine.computerMove()
        }
    }

    checkResult() {
        if (this.Engine?.board.isCheckmate()) {
            this.postGameResult("Checkmate", this.Engine.board.sideToMove === Pieces.white ? Pieces.black : Pieces.white)
        }
        if (this.Engine?.board.isStalemate()) {
            this.postGameResult("Stalemate", 0)
        }
    }

    userMoves(from: number, to: number) {
        if (!this.Engine) {
            return
        }

        this.Engine.playerUCIMove(from, to)
        this.checkResult()

        this.Engine.computerMove()
        this.checkResult()
    }

    handleSliderChange(e: React.ChangeEvent<HTMLInputElement>) {
        let attribute: keyof Customisation

        switch (e.target.name) {
            case "Aggressiveness":
                attribute = "aggressiveness"
                break
            case "Piece Exchanging Tendency":
                attribute = "tradeHappy"
                break
            case "Engine Strength":
                attribute = "strength"
                break
            default:
                throw new Error("Slider name doesn't correspond to attribute")
        }


        let newCustomisation = this.state.customisation
        newCustomisation[attribute] = Number(e.target.value)

        this.setState({
            customisation: newCustomisation
        })
    }

    render() {
        return this.state.submitted && this.Engine ? (
            <div className="page-content" onMouseMove={this.handleMouseMove}>
                <div className="board-container">
                    <BoardElement
                        board={this.Engine.board}
                        sideFacingForward={this.state.playingAs}
                        onUserAttemptsMove={this.userMoves}
                        mouseX={this.state.mouseX}
                        mouseY={this.state.mouseY} />
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
                    <div className="customisation-sliders-container">
                        <CustomisationSlider onChange={this.handleSliderChange} label="Engine Strength" min={0} max={100} default={defaultCustomisation.strength} />
                        <CustomisationSlider onChange={this.handleSliderChange} label="Aggressiveness" min={0} max={100} default={defaultCustomisation.aggressiveness} />
                        <CustomisationSlider onChange={this.handleSliderChange} label="Piece Exchanging Tendency" min={0} max={100} default={defaultCustomisation.tradeHappy} />
                    </div>
                    <div className="submit-container" onClick={this.startGame}>
                        <p>Play</p>
                    </div>
                </div>
            )
    }
}

export default Custom