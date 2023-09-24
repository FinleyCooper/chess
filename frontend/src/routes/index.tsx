import { lazy } from "react";

const Adventure = lazy(() => import("./Adventure"))
const Test = lazy(() => import("./Test"))
const Home = lazy(() => import("./Home"))
const Custom = lazy(() => import("./Custom"))
const Login = lazy(() => import("./Authentication/Login"));
const Signup = lazy(() => import("./Authentication/Signup"));
const History = lazy(() => import("./History"))
const Review = lazy(() => import("./Review"))
const Settings = lazy(() => import("./Settings"))

interface Route {
    readonly name: string;
    readonly element: any;
    readonly path: string;
}

let AdventureRoute: Route = {
    name: "adventure",
    element: Adventure,
    path: "/adventure"
}

let TestRoute: Route = {
    name: "test",
    element: Test,
    path: "/test"
}

let HomeRoute: Route = {
    name: "home",
    element: Home,
    path: "/"
}

let CustomRoute: Route = {
    name: "custom",
    element: Custom,
    path: "/custom"
}

let LoginRoute: Route = {
    name: "login",
    element: Login,
    path: "/login"
}

let SignupRoute: Route = {
    name: "signup",
    element: Signup,
    path: "/signup"
}

let HistoryRoute: Route = {
    name: "history",
    element: History,
    path: "/history"
}

let ReviewRoute: Route = {
    name: "review",
    element: Review,
    path: "/review"
}

let SettingsRoute: Route = {
    name: "settings",
    element: Settings,
    path: "/settings"
}


export const routes: Array<Route> = [LoginRoute, SignupRoute, ReviewRoute]
export const loggedInRoutes: Array<Route> = [AdventureRoute, TestRoute, HomeRoute, CustomRoute, HistoryRoute, SettingsRoute]