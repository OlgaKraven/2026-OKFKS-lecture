import {createContext} from 'react'
import type {ReactNode} from 'react'
import type {Slide} from './model'

export type VisualRendererProps={slide:Slide;base:string;interactive:boolean}
type VisualRenderer=(props:VisualRendererProps)=>ReactNode|undefined

export const VisualRendererContext=createContext<VisualRenderer|undefined>(undefined)

/** Return undefined to retain the engine's visual/steps; null explicitly leaves the slot empty. */
export function VisualRendererProvider({render,children}:{render:VisualRenderer;children:ReactNode}){
 return <VisualRendererContext.Provider value={render}>{children}</VisualRendererContext.Provider>
}
