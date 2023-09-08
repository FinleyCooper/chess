import React from "react";
import { Link, Navigate } from "react-router-dom";

import TextInput from "./../TextInput"

import "../index.css";

interface Props { }
interface State {
    email: string,
    password: string,
    emailError: string | null,
    passwordError: string | null,
    redirect: boolean
}

export default class SignUp extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.handleFormSubmit = this.handleFormSubmit.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);

        this.state = {
            email: "",
            password: "",
            emailError: null,
            passwordError: null,
            redirect: false
        };
    }

    handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({
            [event.target.name]: event.target.value
        } as any);
    }

    handleFormSubmit(event: React.FormEvent) {
        event.preventDefault();

        if (this.state.email.length === 0) {
            this.setState({ emailError: "This field must not be left blank" });
            return;
        };

        if (this.state.password.length === 0) {
            this.setState({ passwordError: "This field must not be left blank" });
            return;
        };

        fetch("/api/login", {
            headers: {
                "content-type": "application/json"
            },
            method: "POST",
            body: JSON.stringify({
                email: this.state.email,
                password: this.state.password
            })
        })
            .then((resp) => resp.json())
            .then((data) => {
                if (data.error === true) {
                    this.setState({
                        emailError: data.message,
                        passwordError: data.message
                    })
                }
                else {
                    this.setState({ redirect: true })
                }
            })
            .catch((e) => {
                this.setState({
                    emailError: "An unexpected error occurred",
                    passwordError: "An unexpected error occurred"
                })
            });
    }

    render() {
        if (this.state.redirect) {
            return (<Navigate to={"/"} />)
        }

        return (
            <div className="form-page">
                <div className="form-container">
                    <form className="form" onSubmit={this.handleFormSubmit}>
                        <h1 className="form-title">
                            Login
                        </h1>
                        <p className="instruction-text">Sign in to your account to continue</p>
                        <div className="credentials-container">
                            <TextInput onChange={this.handleInputChange} label="Email address" name="email" error={this.state.emailError} type="email" />
                            <TextInput onChange={this.handleInputChange} label="Enter your password" name="password" error={this.state.passwordError} type="password" />
                        </div>
                        <div className="submit-container">
                            <button className="submit" onClick={this.handleFormSubmit}>Login</button>
                        </div>
                        <div className="not-registed">
                            <p>Don't have an account? <Link className="form-link" to="/signup">Sign up Here</Link></p>
                        </div>
                    </form>
                </div>
            </div>
        )
    }
}