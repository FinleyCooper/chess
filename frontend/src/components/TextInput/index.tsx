import React, { ChangeEventHandler } from "react";

import "./index.css";

interface Props {
    onBlur?: ChangeEventHandler<HTMLInputElement>,
    onChange?: ChangeEventHandler<HTMLInputElement>,
    valid?: boolean,
    error?: string | null,
    label?: string,
    pattern?: string,
    type?: string,
    name?: string,
}

interface State {
    focused: boolean
}

class TextInput extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.handleFocus = this.handleFocus.bind(this);
        this.handleBlur = this.handleBlur.bind(this);

        this.state = {
            focused: false
        }
    }

    handleFocus(event: React.FocusEvent<HTMLInputElement>) {
        this.setState({ focused: true });
    }

    handleBlur(event: React.FocusEvent<HTMLInputElement>) {
        this.setState({ focused: false });
        (this.props.onBlur || ((e) => { }))(event);
    }

    render() {
        let className = "text-input-container" + (this.state.focused ? " text-input-focused" : "") + (this.props.error ? " text-input-error" : "") + (this.props.valid ? " text-input-valid" : "")

        return (
            <>
                <p className="input-label">{this.props.label}</p>
                <div className={className}>
                    <input className="text-input" onFocus={this.handleFocus} onBlur={this.handleBlur} onChange={this.props.onChange || (() => { })} pattern={this.props.pattern} type={this.props.type || "text"} name={this.props.name} />
                </div>
                <p className="error-text">{this.props.error}</p>
            </>
        )
    }
}

export default TextInput