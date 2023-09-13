import React from "react";

import "./index.css"

interface Props {
    min: number
    max: number
    default: number
    label: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

class CustomisationSlider extends React.Component<Props, {}> {
    constructor(props: Props) {
        super(props)
    }

    render() {
        return (
            <div className="customisation-slider-container">
                <p>{this.props.label}</p>
                <input name={this.props.label} onChange={this.props.onChange} type="range" className="customisation-slider" min={this.props.min} max={this.props.max} defaultValue={this.props.default} />
            </div>
        )
    }
}

export default CustomisationSlider