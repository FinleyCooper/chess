import React from "react"
import BoardElement from "../../components/BoardElement";

import "./index.css"

interface Props { }

interface State {
    mouseX: number;
    mouseY: number;
}

class Play extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)

        this.state = {
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

    gameFinished(gameResult: string, moveList: string) {

    }


    render() {
        return (
            // Add eventlistener for mousemove as movement should not be restricted to the board
            <div className="page-content" onMouseMove={this.handleMouseMove}>
                <div className="board-container">
                    {/* <Board onGameFinished={this.gameFinished} humanPlaysAs={16} mouseX={this.state.mouseX} mouseY={this.state.mouseY} /> */}
                </div>
            </div>
        )
    }
}

export default Play