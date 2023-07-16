import { lazy } from "react";

const Play = lazy(() => import("./Play"))
const Test = lazy(() => import("./Test"))
const Home = lazy(() => import("./Home"))


interface Route {
    readonly name: string;
    readonly element: any;
    readonly path: string;
}

let PlayRoute: Route = {
    name: "play",
    element: Play,
    path: "/play" // TODO: change to /play
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

const routes: Array<Route> = [PlayRoute, TestRoute, HomeRoute]

export default routes