import React from 'react'
import { Navigate } from "react-router-dom";

import pieceSVGs from "./icons.svg"
import "./index.css"

interface Props {

}

interface State {
    buttonClicked: string
}

class Home extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)

        this.state = {
            buttonClicked: ""
        }
    }

    redirect(path: string) {
        this.setState({
            buttonClicked: path
        })
    }

    render() {
        return this.state.buttonClicked === "" ? (
            <div className="home-container">
                <h1 className='page-title'>{"{ thochess }"}</h1>
                <div className="option-container">
                    <div onClick={(e) => this.redirect("/play")} className="option">
                        <p className="option-title">Continue Adventure</p>
                        <svg className="option-icon" viewBox='0 0 100 100'>
                            <use href={`${pieceSVGs}#adventure-symbol`} />
                        </svg>
                        <div className="progression">
                            <div className="progress-border">
                                <p className="progress-bar-text">6/10</p>
                            </div>
                            <div className="progress-fluid">
                            </div>
                        </div>
                    </div>
                    <div onClick={(e) => this.redirect("/custom")} className="option">
                        <p className="option-title">Custom Game</p>
                        <svg className="option-icon" viewBox='0 0 100 100'>
                            <use href={`${pieceSVGs}#customisation-symbol`} />
                        </svg>
                    </div>
                    <div className="option">
                        <p className="option-title">View Game History</p>
                        <svg className="option-icon" viewBox='0 0 100 100'>
                            <use href={`${pieceSVGs}#analysis-symbol`} />
                        </svg>
                    </div>
                    <div className="option">
                        <p className="option-title">Settings</p>
                        <svg className="option-icon" viewBox='0 0 100 100'>
                            <use href={`${pieceSVGs}#settings-symbol`} />
                        </svg>
                    </div>
                </div>
            </div>
        ) : (
            <Navigate to={this.state.buttonClicked} />
        )
    }
}

export default Home