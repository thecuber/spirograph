export interface Spiro{
    
    color_hue: number;
    color_sat: number;
    color_light: number;
    outerSize: number;//percentage of big parent size
    innerWidthSize: number;
    innerHeightSize: number;
    innerXDelta: number;
    innerAngleDelta: number;
    innerRotation: number;
    outerRotation: number; 
    pens: Pen[];
}

export interface Pen{
    color: any;
    angle: number;
    ray: number;

}

export interface Point{
    left : number;
    top: number;
    color: any;
}

export enum State{
    RUNNING = "Stop drawing",
    NOT_RUNNING = "Start drawing"
}