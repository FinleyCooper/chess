import React from 'react'
import pieceSVGs from "./../Play/Board/pieces.svg"

import "./index.css"

interface Props { }
interface State { }

class Custom extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
    }


    render() {
        return (
            <div className="customisation-container">
                <div className="customisation-option-container">
                    <div className="customisation-option">
                        <p className="customisation-option-title">Play as White</p>
                        <svg className="customisation-option-icon" viewBox='0 0 100 100'>
                            <use href={`${pieceSVGs}#white-king`} />
                        </svg>
                    </div>
                    <div className="customisation-option">
                        <p className="customisation-option-title">Play as Black</p>
                        <svg className="customisation-option-icon" viewBox='0 0 100 100'>
                            <use href={`${pieceSVGs}#black-king`} />
                        </svg>
                    </div>
                </div>
            </div>
        )
    }
}

export default Custom