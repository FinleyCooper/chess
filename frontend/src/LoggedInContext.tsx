import { createContext } from "react"

export type LoggedInContextType = { id: number, displayName: string, levelid: string }

export const defaultLoggedInContext: LoggedInContextType = {
    id: -1,
    displayName: "",
    levelid: "0"
}

export const LoggedInContext = createContext(defaultLoggedInContext)