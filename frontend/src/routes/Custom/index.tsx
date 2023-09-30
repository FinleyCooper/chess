import React from 'react'
import pieceSVGs from "../../components/BoardElement/pieces.svg"
import BoardElement from '../../components/BoardElement'
import { Pieces } from '../../components/BoardElement/constants'
import { LoggedInContext } from '../../LoggedInContext'
import Engine from "../../engine"
import { Customisation, defaultCustomisation } from '../../engine/Engine'
import CustomisationSlider from './CustomisationSlider'

import "./index.css"
import Move from '../../engine/Move'

interface Props { }
interface State {
    playingAs: number
    submitted: boolean
    mouseX: number
    mouseY: number
    customisation: Customisation
    lastMove: Move | null
    gameResult: string
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
        this.checkIfGameover = this.checkIfGameover.bind(this)
        this.handleSliderChange = this.handleSliderChange.bind(this)

        this.state = {
            playingAs: 0,
            submitted: false,
            mouseX: 0,
            mouseY: 0,
            customisation: defaultCustomisation,
            lastMove: null,
            gameResult: ""
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
        console.log("ere")
        this.setState({
            gameResult: gameResult
        })
        fetch(`/api/users/${this.context.id}/games`, {
            headers: {
                "content-type": "application/json"
            },
            method: "PUT",
            body: JSON.stringify({
                moveList: this.Engine?.getMoveListString(),
                gameResult: gameResult,
                customSettings: this.state.customisation,
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

        this.Engine = Engine.fromStartingPosition(defaultCustomisation)

        if (this.state.playingAs === Pieces.black) {
            this.Engine.setAggression(Pieces.white)
            this.Engine.computerMove()
                .then(engineMove => {
                    this.setState({ lastMove: engineMove })
                })
        }
        else {
            this.Engine.setAggression(Pieces.black)
        }
    }

    checkIfGameover() {
        if (this.Engine?.board.isCheckmate()) {
            this.postGameResult("Checkmate", this.Engine.board.sideToMove === Pieces.white ? Pieces.black : Pieces.white)
            return true
        }
        if (this.Engine?.board.isStalemate()) {
            this.postGameResult("Stalemate", 0)
            return true
        }
        return false
    }

    userMoves(from: number, to: number) {
        if (!this.Engine) {
            return
        }

        const move = this.Engine.playerUCIMove(from, to)
        this.setState({ lastMove: move })

        if (this.checkIfGameover()) {
            return
        }

        this.Engine.computerMove()
            .then(engineMove => {
                this.setState({ lastMove: engineMove })
                this.checkIfGameover()
            })

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
            case "Engine Depth":
                attribute = "depth"
                break
            case "Positional Strength":
                attribute = "positionalPlay"
                break
            case "Blind Spots":
                attribute = "blindSpots"
                break
            default:
                throw new Error(`Slider name ${e.target.name} doesn't correspond to attribute`)
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
                <div className="game-result">
                    <p>{this.state.gameResult}</p>
                </div>
                <div className="board-container">
                    <BoardElement
                        board={this.Engine.board}
                        sideFacingForward={this.state.playingAs}
                        onUserAttemptsMove={this.userMoves}
                        mouseX={this.state.mouseX}
                        mouseY={this.state.mouseY}
                        lastMove={this.state.lastMove}
                    />
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
                        <CustomisationSlider onChange={this.handleSliderChange} label="Engine Depth" min={1} max={4} default={defaultCustomisation.depth} />
                        <CustomisationSlider onChange={this.handleSliderChange} label="Positional Strength" min={0} max={100} default={defaultCustomisation.positionalPlay} />
                        <CustomisationSlider onChange={this.handleSliderChange} label="Aggressiveness" min={0} max={100} default={defaultCustomisation.aggressiveness} />
                        <CustomisationSlider onChange={this.handleSliderChange} label="Blind Spots" min={0} max={50} default={defaultCustomisation.blindSpots} />
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