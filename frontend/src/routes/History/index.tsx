import React from "react"
import { LoggedInContext } from "../../LoggedInContext"
import Game from "./Game"

import "./index.css"

interface Props { }

interface State {
    games: { id: string, move_list: string, game_result: string, human_plays_as: number, winner: number, date_played: string, custom_settings: string }[]
    fetched: boolean
}

class History extends React.Component<Props, State> {
    static contextType = LoggedInContext
    declare context: React.ContextType<typeof LoggedInContext>

    constructor(props: Props) {
        super(props)

        this.state = {
            games: [],
            fetched: false
        }
    }

    fetchData(): void {
        if (this.state.fetched || this.context.id === -1) {
            return
        }

        fetch(`/api/users/${this.context.id}/games/all`).then(resp => resp.json()).then(data => {
            this.setState({
                games: data.data,
                fetched: true
            })
        })
    }

    componentDidUpdate = this.componentDidMount = this.fetchData

    render() {
        return (
            <div className="history-container">
                <h1>Past Games</h1>
                {this.state.games.map((game, index) => (
                    <Game
                        key={`path-${game.id}-${index}`}
                        id={game.id}
                        moveList={game.move_list}
                        gameResult={game.game_result}
                        humanPlaysAs={game.human_plays_as}
                        winner={game.winner}
                        datePlayed={game.date_played}
                        customSettings={game.custom_settings}
                    />
                ))}
            </div>
        )
    }
}

export default History