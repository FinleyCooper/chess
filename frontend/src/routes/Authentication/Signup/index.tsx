import React from "react";
import { Link, Navigate } from "react-router-dom";

import TextInput from "../../../components/TextInput"

import "../index.css"

// Code in this file is borrowed from a previous project that I made
// All code is my own implementation however, unless commented otherwise
interface Props { }
interface State {
    email: string,
    name: string,
    password: string,
    confirmPassword: string,
    terms: boolean,
    emailError: string | null,
    nameError: string | null,
    passwordError: string | null,
    confirmPasswordError: string | null,
    termsError: string | null,
    emailValid: boolean,
    nameValid: boolean,
    passwordValid: boolean,
    confirmPasswordValid: boolean,
    summited: boolean
}

class Signup extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.handleFormSubmit = this.handleFormSubmit.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.validateInput = this.validateInput.bind(this);
        this.confirmConfirmPassword = this.confirmConfirmPassword.bind(this);
        this.setFormError = this.setFormError.bind(this);

        this.state = {
            email: "",
            name: "",
            password: "",
            confirmPassword: "",
            terms: false,
            emailError: null,
            nameError: null,
            passwordError: null,
            confirmPasswordError: null,
            termsError: null,
            emailValid: false,
            nameValid: false,
            passwordValid: false,
            confirmPasswordValid: false,
            summited: false
        };
    }

    setFormError(value: string, message: string | null) {
        this.setState({ [`${value}Valid`]: false } as any); // Not best practice, but hard to get around using type assertations
        this.setState({ [`${value}Error`]: message } as any);
    }


    validateInput(event: React.FocusEvent<HTMLInputElement>) {
        let field = event.target.name;

        if (event.target.validity.patternMismatch) {
            if (field === "email") {
                this.setFormError(field, "Please use a valid email");
            }
            else if (field === "name") {
                this.setFormError(field, "Names must be bewtween 2 and 32 characters and not end or start with a space")
            }
            else if (field === "password") {
                this.setFormError(field, "Passwords must contain between 8 and 32 characters, at least 1 uppercase, 1 lowercase, and 1 number");
            }

        }
        else {
            this.setFormError(field, null);

            if (event.target.value.length > 0) {
                this.setState({ [`${field}Valid`]: true } as any);
            }
        }

        if (event.target.name === "confirmPassword") {
            this.confirmConfirmPassword(event);
        }
    }

    confirmConfirmPassword(event: React.FocusEvent<HTMLInputElement>) {
        if (event.target.value === this.state.password) {
            this.setFormError(event.target.name, null);
            this.setState({ [`${event.target.name}Valid`]: true } as any);
        }
        else {
            if (this.state.password !== "") {
                this.setFormError(event.target.name, "Passwords do not match");
            }
            else {
                this.setState({ [`${event.target.name}Valid`]: false } as any);
            }
        }
    }

    handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
        const target = event.target;
        const value = target.type === "checkbox" ? target.checked : target.value;

        this.setState({ [target.name]: value } as any);
    }

    handleFormSubmit(event: React.FormEvent) {
        event.preventDefault();

        let continueToFetching = true;
        const fields: ("email" | "password" | "confirmPassword" | "name")[] = ["email", "password", "confirmPassword", "name"];

        fields.forEach((item) => {
            if (this.state[item].length === 0) {
                this.setFormError(item, "This field must not be left blank");
                continueToFetching = false;
            };
        });

        if (!this.state.terms) {
            this.setFormError("terms", "You must agree to the Terms & Conditions and Privacy Policy to register");
            continueToFetching = false
        }
        else {
            this.setFormError("terms", null);
        }

        if (!continueToFetching) return;

        fetch("/api/signup", {
            headers: {
                "content-type": "application/json"
            },
            method: "POST",
            body: JSON.stringify({
                email: this.state.email,
                password: this.state.password,
                name: this.state.name
            })
        })
            .then((resp) => resp.json())
            .then((data) => {
                if (data.error === true) {
                    this.setFormError("email", data.message);
                }
                else {
                    this.setState({ summited: true });
                };
            })
            .catch(() => {
                this.setFormError("terms", "An unexpected error occurred");
            });
    }

    render() {
        if (this.state.summited) {
            return (
                <Navigate to={"/login"} />
            );
        };

        return (
            <div className="form-page">
                <div className="form-container">
                    <form className="form">
                        <h1 className="form-title">Sign Up</h1>
                        <p className="instruction-text">Create an account to continue</p>
                        <div className="credentials-container">
                            <TextInput onBlur={this.validateInput} onChange={this.handleInputChange} valid={this.state.emailValid} error={this.state.emailError} label="Email address" name="email" type="email" pattern="^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$" /> { /* not my Regex - RFC 822 Compliant by Cal Handerson */}
                            <TextInput onBlur={this.validateInput} onChange={this.handleInputChange} valid={this.state.nameValid} error={this.state.nameError} label="Display Name" name="name" pattern="^\S.{1,28}\S$" />
                            <TextInput onBlur={this.validateInput} onChange={this.handleInputChange} valid={this.state.passwordValid} error={this.state.passwordError} label="Create Password" name="password" type="password" pattern="^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,32}$" /> { /* not my Regex */}
                            <TextInput onBlur={this.validateInput} onChange={this.handleInputChange} valid={this.state.confirmPasswordValid} error={this.state.confirmPasswordError} label="Confirm Password" name="confirmPassword" type="password" />
                            <div className="terms-container">
                                <input id="terms" type="checkbox" name="terms" onChange={this.handleInputChange} />
                                <label className="terms-label" htmlFor="terms">I agree to the <a href={"#"} className="form-link">Terms & Conditions</a> and <a href={"#"} className="form-link">Privacy Policy</a>.</label>
                                <p className="error-text">{this.state.termsError}</p>
                            </div>
                            <div className="submit-container">
                                <button className="submit" onClick={this.handleFormSubmit}>Sign Up</button>
                            </div>
                        </div>
                        <div className="already-registed">
                            <p>Already Reigstered? <Link className="form-link" to="/login">Login Here</Link></p>
                        </div>
                    </form>
                </div>
            </div>
        );
    }
}

export default Signup