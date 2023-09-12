import { createContext } from "react"

export type LoggedInContextType = { id: number, displayName: string }

export const defaultLoggedInContext: LoggedInContextType = {
    id: -1,
    displayName: "",
}

export const LoggedInContext = createContext(defaultLoggedInContext)