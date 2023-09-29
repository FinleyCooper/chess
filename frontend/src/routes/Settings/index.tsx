import React from "react"
import { Navigate } from "react-router-dom"

import { LoggedInContext } from "../../LoggedInContext"
import TextInput from "../../components/TextInput"
import "./index.css"

interface Props { }
interface State {
    nameError: string | null,
    nameValid: boolean,
    name: string
    redirected: boolean
}

class Settings extends React.Component<Props, State> {
    static contextType = LoggedInContext
    declare context: React.ContextType<typeof LoggedInContext>

    constructor(props: Props) {
        super(props)

        this.state = {
            nameError: null,
            nameValid: false,
            name: "",
            redirected: false
        }

        this.validateInput = this.validateInput.bind(this)
        this.handleInputChange = this.handleInputChange.bind(this)
        this.submitNameChange = this.submitNameChange.bind(this)
        this.deleteAccount = this.deleteAccount.bind(this)
    }

    deleteAccount(e: React.MouseEvent) {
        fetch(`/api/users/${this.context.id}`, {
            method: "DELETE"
        }).then(() => {
            this.setState({ redirected: true })
        })
    }

    submitNameChange(e: React.MouseEvent) {
        if (this.state.nameValid) {
            fetch(`/api/users/${this.context.id}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ displayName: this.state.name })
            }).then(() => window.location.reload())
        }
    }

    validateInput(e: React.FocusEvent<HTMLInputElement>) {
        if (e.target.validity.patternMismatch) {
            this.setState({ nameError: "Names must be bewtween 2 and 32 characters and not end or start with a space", nameValid: false })
        }
        else {
            this.setState({ nameError: null, nameValid: true })
        }
    }

    handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ name: e.target.value })
    }



    render() {
        if (this.state.redirected) {
            return (<Navigate to={"/signup"} />)
        }

        return (
            <div className="settings-page">
                <h1>Settings</h1>
                <TextInput
                    name="name"
                    pattern="^\S.{1,28}\S$"
                    error={this.state.nameError}
                    valid={this.state.nameValid}
                    onBlur={this.validateInput}
                    onChange={this.handleInputChange}
                    label="Change Display Name"
                />
                <button className="submit" onClick={this.submitNameChange}>Change Name</button>
                <button className="submit" onClick={this.deleteAccount}>Delete Account</button>
            </div>

        )
    }
}

export default Settings