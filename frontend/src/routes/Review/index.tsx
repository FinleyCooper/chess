import React from "react";
import Engine from "../../engine";
import Move from "../../engine/Move";
import BoardElement from "../../components/BoardElement";

import "./index.css"

type Game = { UCIMoveHistory: number[][], viewAs: number, winner: number }

interface State {
    mouseX: number
    mouseY: number
    game: Game | null
    moveIndex: number
    lastMove: Move | null
}

interface Props {

}

class Review extends React.Component<Props, State> {
    Engine: Engine

    constructor(props: Props) {
        super(props)

        this.state = {
            mouseX: 0,
            mouseY: 0,
            game: null,
            moveIndex: 0,
            lastMove: null
        }

        this.Engine = Engine.fromStartingPosition()

        this.nextMove = this.nextMove.bind(this)

    }

    componentDidMount(): void {
        const params = new URLSearchParams(window.location.search)

        fetch(`/api/users/${params.get("userid")}/games/${params.get("gameid")}`)
            .then(resp => resp.json())
            .then(data => {
                if (!data.error) {
                    this.setState({
                        game: {
                            UCIMoveHistory: Engine.moveHistoryStringToUCI(data.data.move_list),
                            viewAs: data.data.human_plays_as,
                            winner: data.data.winner
                        }
                    })
                }
            })
    }

    handleMouseMove = (event: React.MouseEvent) => {
        this.setState({
            mouseX: event.clientX,
            mouseY: event.clientY,
        })
    }

    nextMove(e: React.MouseEvent) {
        if (!this.state.game) {
            return
        }

        const uciMove = this.state.game.UCIMoveHistory[this.state.moveIndex]

        if (uciMove === undefined) {
            return
        }

        const move = this.Engine.playerUCIMove(uciMove[0], uciMove[1])

        this.setState({
            moveIndex: this.state.moveIndex + 1,
            lastMove: move
        })
    }

    render() {
        return (
            <div className="review-container" onMouseMove={this.handleMouseMove}>
                <div className="board-container">
                    <BoardElement
                        sideFacingForward={this.state.game?.viewAs ? this.state.game.viewAs : 16}
                        onUserAttemptsMove={() => { }}
                        board={this.Engine.board}
                        mouseX={this.state.mouseX}
                        mouseY={this.state.mouseY}
                        lastMove={this.state.lastMove}
                    />
                    <button className="next-move-button" onClick={this.nextMove}>Next Move</button>
                </div>
            </div>
        )
    }
}


export default Review