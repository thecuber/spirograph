export interface Spiro{
    
    /**Static variable for size, all ratios */
    outerSize: number;
    innerWidth: number;
    innerHeight: number;
    innerXDelta: number;
    innerAngleDelta: number;
    pens: Pen[];
    /**Drawing stuff */
    canvasContext ?: CanvasRenderingContext2D;
    color_hue: number;
    color_sat: number;
    color_light: number;
    visible: boolean;
    /**Coordinates which will be updating*/
    origin ?: [number, number];
    innerRotation : number;
    outerRotation: number; 
    size ?: number;
    innerOrigin ?: [number, number];
    innerWidthSize ?: number;
    innerHeightSize ?: number;
    innerOutputRotation ?: number;
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