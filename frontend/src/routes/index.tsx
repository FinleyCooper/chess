import { lazy } from "react";

const Play = lazy(() => import("./Play"))
const Test = lazy(() => import("./Test"))

interface Route {
    readonly name: string;
    readonly element: any;
    readonly path: string;
}

let PlayRoute: Route = {
    name: "play",
    element: Play,
    path: "/" // TODO: change to /play
}

let TestRoute: Route = {
    name: "test",
    element: Test,
    path: "/test"
}

const routes: Array<Route> = [PlayRoute, TestRoute]

export default routes