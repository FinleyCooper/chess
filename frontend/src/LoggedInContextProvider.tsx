import React from "react"
import { LoggedInContext, LoggedInContextType, defaultLoggedInContext } from "./LoggedInContext"

interface Props {
    children: React.ReactNode
}

interface State {
    userData: LoggedInContextType
}

class LoggedInContextProvider extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)

        this.state = {
            userData: defaultLoggedInContext
        }
    }

    componentDidMount() {
        fetch("/api/users/@me").then(resp => resp.json()).then(data => {
            if (!data.error) {
                this.setState({
                    userData: {
                        id: data.data.id,
                        displayName: data.data.name
                    }
                })
            }
        })
    }

    render() {
        return (
            <LoggedInContext.Provider value={this.state.userData}>
                {this.props.children}
            </LoggedInContext.Provider>
        )
    }
}

export default LoggedInContextProvider