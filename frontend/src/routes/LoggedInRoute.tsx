import { Outlet, Navigate } from "react-router-dom"


const LoggedInRoute = () => {
    const cookieArray: string[][] = document.cookie.split("; ").map(cookie => cookie.split("="))
    const loggedInCookie: string[][] = cookieArray.filter(cookie => cookie[0] === "isLoggedIn")
    const isLoggedIn: boolean = !!loggedInCookie.length && (loggedInCookie[0][1] === "true")

    return isLoggedIn ? <Outlet /> : <Navigate to="/login" />
}

export default LoggedInRoute