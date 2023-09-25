import React from "react"
import BoardElement from "../../components/BoardElement";
import { LoggedInContext } from "../../LoggedInContext";
import Engine, { Customisation } from "../../engine/Engine";

import "./index.css"
import { Pieces } from "../../engine/constants";
import Move from "../../engine/Move";

interface Props { }

interface State {
    mouseX: number
    mouseY: number
    customisation: Customisation | null
    text: Array<string> | null
    name: string
    textIndex: number
    lastMove: Move | null
}

const LAST_LEVEL_ID = "9"

class Adventure extends React.Component<Props, State> {
    static contextType = LoggedInContext
    declare context: React.ContextType<typeof LoggedInContext>
    Engine: Engine | null


    constructor(props: Props) {
        super(props)

        this.state = {
            mouseX: 0,
            mouseY: 0,
            customisation: null,
            text: null,
            name: "",
            textIndex: 0,
            lastMove: null
        }

        this.Engine = null

        this.fetchLevel = this.fetchLevel.bind(this)
        this.handleNextText = this.handleNextText.bind(this)
        this.userAttempsMove = this.userAttempsMove.bind(this)
    }

    fetchLevel(): void {
        if (this.context.levelid === "0" || this.state.name !== "") {
            return
        }

        fetch(`/api/adventure-levels/${this.context.levelid}`)
            .then(resp => resp.json())
            .then(data => {
                const name = data.data.battle_settings.name
                delete data.data.battle_settings.name

                this.setState({
                    customisation: data.data.battle_settings,
                    name: name,
                    text: data.data.text
                })
            })
    }

    componentDidUpdate = this.componentDidMount = this.fetchLevel

    nextLevel() {
        if (this.context.levelid === LAST_LEVEL_ID) {
            // Adventure finshed
            return
        }

        fetch(`/api/users/${this.context.id}/adventure-levels`, {
            method: "PATCH",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                levelid: (Number(this.context.levelid) + 1).toString()
            })
        })
            .then(resp => resp.json())
            .then(data => {
                if (!data.error) {
                    window.location.reload() // Refetch next level
                }
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
                customSettings: this.state.customisation,
                humanPlaysAs: 16, // TODO: CHANGE
                winner: winner,
                levelid: this.context.levelid,
                campaignid: this.context.id // TODO: CHANGE - userid may not equal campaign id
            })
        })
            .then(resp => resp.json())
            .then(data => {
                if (!data.error) {
                    this.nextLevel()
                }
            })
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

    userAttempsMove(from: number, to: number) {
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

    handleMouseMove = (event: React.MouseEvent) => {
        this.setState({
            mouseX: event.clientX,
            mouseY: event.clientY,
        })
    }

    handleNextText(e: React.MouseEvent) {
        if (!this.state.text) {
            return
        }

        if (this.state.textIndex >= this.state.text.length && this.state.customisation) {
            this.Engine = Engine.fromStartingPosition(this.state.customisation)
            this.forceUpdate()
        }
        else {
            this.setState({
                textIndex: this.state.textIndex + 1
            })
        }
    }

    render() {
        if (!this.state.text) {
            return (<>Loading...</>)
        }

        if ((this.state.textIndex >= this.state.text.length) && !!this.Engine) {
            return (
                <div className="page-content" onMouseMove={this.handleMouseMove}>
                    <div className="board-container">
                        <div className="players-container">
                            <div className="opponent-container">
                                {this.state.name}
                            </div>
                            <div className="user-container">
                                {this.context.displayName}
                            </div>
                        </div>
                        <BoardElement
                            board={this.Engine.board}
                            onUserAttemptsMove={this.userAttempsMove}
                            sideFacingForward={16}
                            mouseX={this.state.mouseX}
                            mouseY={this.state.mouseY}
                            lastMove={this.state.lastMove}
                        />
                    </div>
                </div>
            )
        }
        else {
            return (
                <div className="page-content">
                    <div className="centred-text">
                        <p className="story-text">{this.state.text[this.state.textIndex]}</p>
                    </div>
                    <button onClick={this.handleNextText}> Continue...</button>
                </div>
            )
        }
    }
}

export default Adventure