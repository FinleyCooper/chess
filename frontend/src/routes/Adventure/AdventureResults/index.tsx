import React from "react"

import "./index.css"

const canvas_width = 500
const canvas_height = 600

interface Props {
    games: any
}
interface State { }

class AdventureResults extends React.Component<Props, State> {
    canvasRef: React.RefObject<HTMLCanvasElement>

    constructor(props: Props) {
        super(props)

        this.canvasRef = React.createRef()

        this.downloadCanvas = this.downloadCanvas.bind(this)

        this.state = {}
    }


    componentDidMount(): void {
        const context = this.canvasRef.current!.getContext("2d")!

        context.fillStyle = "#fff9ff";
        context.font = '28px "Varela Round"'
        context.fillRect(0, 0, canvas_width, canvas_height)
        context.fillStyle = "#000000"
        context.fillText("Thochess Adventure Champion!", 35, 60)
        context.font = '18px "Varela Round"'

        const games = this.props.games.map((game: any) => {
            game.custom_settings = JSON.parse(game.custom_settings)
            return game
        })

        const numberOfGames = games.length
        const numberOfWins = games.filter((game: any) => game.winner === game.human_plays_as).length
        const numberOfLosses = games.filter((game: any) => (game.winner !== game.human_plays_as) && game.winner !== 0).length
        const numberOfDraws = games.filter((game: any) => game.winner === 0).length
        const winRate = Math.round(100 * numberOfWins / numberOfGames)

        const aggressiveGames = games.filter((game: any) => game.custom_settings.aggressiveness >= 75)
        const aggressiveWinRate = Math.round(100 * (aggressiveGames.filter((game: any) => game.winner === game.human_plays_as).length / aggressiveGames.length))

        const tradeHeavyGames = games.filter((game: any) => game.custom_settings.tradeHappy >= 75)
        const tradeHeavyWinRate = Math.round(100 * (tradeHeavyGames.filter((game: any) => game.winner === game.human_plays_as).length / tradeHeavyGames.length))

        const positionallyStrongGames = games.filter((game: any) => game.custom_settings.positionalPlay >= 75)
        const positionallyStrongWinRate = Math.round(100 * (positionallyStrongGames.filter((game: any) => game.winner === game.human_plays_as).length / positionallyStrongGames.length))

        const tacticallyStrongGames = games.filter((game: any) => game.custom_settings.blindSpots <= 15)
        const tacticallyStrongWinRate = Math.round(100 * (tacticallyStrongGames.filter((game: any) => game.winner === game.human_plays_as).length / tacticallyStrongGames.length))

        const adventureFinishedDate = games.filter((game: any) => game.level_id === "8")[0].date_played.slice(0, 10)

        context.fillText(`You have played ${numberOfGames} games...`, 30, 125)
        context.fillText(`You won ${numberOfWins}.`, 60, 160)
        context.fillText(`You drew ${numberOfDraws}.`, 60, 190)
        context.fillText(`You lost ${numberOfLosses}.`, 60, 220)
        context.fillText(`That's a win rate of ${winRate}%.`, 45, 255)
        context.fillText(`Your win rate against different playstyles...`, 30, 305)
        context.fillText(`Aggressive Opponents: ${aggressiveWinRate}%`, 60, 340)
        context.fillText(`Trade Heavy Opponents: ${tradeHeavyWinRate}%`, 60, 370)
        context.fillText(`Positionally Strong Opponents: ${positionallyStrongWinRate}%`, 60, 400)
        context.fillText(`Tactically Strong Opponents: ${tacticallyStrongWinRate}%`, 60, 430)
        context.fillText(`You beat the Dragon of Valnera on ${adventureFinishedDate}!`, 30, 580)
    }

    downloadCanvas(e: React.MouseEvent) {
        const dataURL = this.canvasRef.current?.toDataURL("image/png")

        if (dataURL === undefined) {
            return
        }

        const tempLink = document.createElement("a")
        tempLink.href = dataURL
        tempLink.download = "Thochess Statistics.png"
        document.body.append(tempLink)
        tempLink.click()
        document.body.removeChild(tempLink)
    }

    render() {
        return (
            <div className="statistics-container">
                <h3>Statistics of your games played. Come back after playing some games and it'll update!</h3>
                <canvas width={canvas_width} height={canvas_height} ref={this.canvasRef} className="results-canvas" />
                <button className="submit" onClick={this.downloadCanvas}>Download</button>
            </div>
        )
    }
}

export default AdventureResults