import { lazy } from "react";

const Play = lazy(() => import("./Play"))
const Test = lazy(() => import("./Test"))
const Home = lazy(() => import("./Home"))
const Custom = lazy(() => import("./Custom"))
const Login = lazy(() => import("./Authentication/Login"));
const Signup = lazy(() => import("./Authentication/Signup"));

interface Route {
    readonly name: string;
    readonly element: any;
    readonly path: string;
}

let PlayRoute: Route = {
    name: "play",
    element: Play,
    path: "/play"
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



export const routes: Array<Route> = [LoginRoute, SignupRoute]
export const loggedInRoutes: Array<Route> = [PlayRoute, TestRoute, HomeRoute, CustomRoute]