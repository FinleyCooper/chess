import React from "react"

import { LoggedInContext } from "../../LoggedInContext"

import "./index.css"

interface Props {
    id: string,
    moveList: string,
    gameResult: string,
    humanPlaysAs: number,
    winner: number,
    datePlayed: string,
    customSettings: string,
}

interface State { }

class History extends React.Component<Props, State> {
    static contextType = LoggedInContext
    declare context: React.ContextType<typeof LoggedInContext>

    constructor(props: Props) {
        super(props)
    }

    createLink(e: React.MouseEvent, id: string) {
        e.preventDefault()

        fetch(`/api/users/${this.context.id}/games/${id}/link`).then(resp => resp.json()).then(data => {
            if (!data.error) {
                navigator.clipboard.writeText(`${window.location.origin}${data.data.linkPath}`)
            }
        })

    }

    render() {
        const title = this.props.gameResult === "Draw" ? "Draw" : (this.props.humanPlaysAs === this.props.winner ? `Win ${this.props.gameResult}` : `Loss by ${this.props.gameResult}`)

        return (
            <div className="game">
                <p>{title}</p>
                <p>Played as {this.props.humanPlaysAs === 16 ? "white" : "black"}</p>
                <p>Moves: {Math.ceil(this.props.moveList.split(" ").length / 2)}</p>
                <p onClick={(e) => this.createLink(e, this.props.id)}>Share</p>
            </div>
        )
    }
}

export default History