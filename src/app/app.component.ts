import { Options } from '@angular-slider/ngx-slider';
import { Component, ElementRef, OnInit, QueryList, TemplateRef, ViewChild, ViewChildren } from '@angular/core';
import { faCoffee } from '@fortawesome/free-solid-svg-icons';
import { interval, Observable, Subscription } from 'rxjs';
import { Pen, Point, Spiro, State } from './model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  coffee = faCoffee;

  spiros: Spiro[] = [];
  selectedCircle: number = -1;

  @ViewChildren('spiroCanvas')
  spiroCanvas !: QueryList<ElementRef<HTMLCanvasElement>>;

  @ViewChild('wrapperCanvas', { static: true })
  wrapperCanvas !: ElementRef<HTMLCanvasElement>;

  @ViewChild('dotCanvas', { static: true })
  dotCanvas !: ElementRef<HTMLCanvasElement>;
  dotContext !: CanvasRenderingContext2D;

  width !: number;
  height !: number;

  TPS = 1000 / 60;

  drawingSubscription !: Subscription;

  points: [number, number, string][] = [];

  state: State = State.NOT_RUNNING;

  constructor() { }

  ngOnInit() {
    this.addSpiro();
    this.width = this.wrapperCanvas.nativeElement.width;
    this.height = this.wrapperCanvas.nativeElement.height;
    var ctx = this.wrapperCanvas.nativeElement.getContext('2d');
    ctx?.arc(this.width / 2, this.height / 2, this.width / 2, 0, 2 * Math.PI);
    ctx?.stroke();
    this.dotContext = this.dotCanvas.nativeElement.getContext('2d')!;
  }

  addSpiro() {
    var pens: Pen[] = [];
    if(this.spiros.length > 0){
      var pen = { color: 'black', angle: 0, ray: 0.6 };
     pens.push(pen);
    }
    this.spiros.push({
      color_hue: Math.floor(Math.random() * 361),
      color_sat: Math.floor(Math.random() * 100),
      color_light: 20,
      outerSize: 0.52,
      innerWidth: 0.25,
      innerHeight: 0.25,
      innerXDelta: 0.1,
      innerAngleDelta: 0,
      innerRotation: 0,
      outerRotation: 0,
      pens : pens,
      visible: true
    });
    setTimeout(() => this.settingsModified(), 50);
  }

  sliderOptions(min: number, max: number): Options {
    return {
      floor: min,
      ceil: max
    };
  }

  setVisible(b: boolean, spiro: Spiro){
    spiro.visible = b;
    this.settingsModified();
  }

  move_origin(x: number, y: number, ray: number, angle: number): [number, number] {
    return [x + ray * Math.cos(angle), y + ray * Math.sin(angle)];
  }

  hsl(hue: number, sat: number, light: number): string {
    return 'hsl(' + hue + ',' + sat + '%,' + light + '%)';
  }

  settingsModified() {
    this.points = [];
    this.update();
    this.draw();
  }

  init() {
    this.spiroCanvas.forEach((canvas, index) => {
      var spiro = this.spiros[index];
      console.log(canvas);
      var context = canvas.nativeElement.getContext('2d')!;
      context.fillStyle = this.hsl(spiro.color_hue, spiro.color_sat, 60);
      context.strokeStyle = this.hsl(spiro.color_hue, spiro.color_sat, 20);
      context.lineWidth = 2;
      spiro.canvasContext = context;
    });
  }

  run() {
    for (var i = 0; i < 5; i++) {
      this.move();
      this.update();
    }
    this.draw();
  }

  move() {
    const OMEGA = 1;
    for (var i = this.spiros.length - 1; i >= 0; i--) {
      var spiro = this.spiros[i];
      spiro.innerRotation += OMEGA * this.TPS / 1000;
      spiro.outerRotation -= spiro.outerSize * OMEGA * this.TPS / 1000;
    }
  }

  update() {
    var [originx, originy] = [this.width / 2, this.height / 2];
    var parentRotation = 0;
    var ray = this.width / 2;
    this.spiros.forEach((spiro) => {
      parentRotation += spiro.outerRotation;
      [originx, originy] = this.move_origin(originx, originy, ray * (1 - spiro.outerSize), parentRotation);
      spiro.origin = [originx, originy];
      ray *= spiro.outerSize;
      spiro.size = ray;
      parentRotation += spiro.innerRotation;
      spiro.pens.forEach((pen) => {
        var [penx, peny] = this.move_origin(originx, originy, ray * pen.ray, pen.angle + parentRotation);
        this.points.push([penx, peny, pen.color]);
      });
      spiro.innerWidthSize = spiro.size * spiro.innerWidth;
      spiro.innerHeightSize = spiro.size * spiro.innerHeight;
      [originx, originy] = this.move_origin(originx, originy, ray * spiro.innerXDelta, parentRotation);
      spiro.innerOrigin = [originx, originy];
      parentRotation += spiro.innerAngleDelta;
      spiro.innerOutputRotation = parentRotation;
      ray *= Math.min(spiro.innerWidth, spiro.innerHeight);
    });

  }

  drawSpiro(spiro: Spiro, context: CanvasRenderingContext2D, last: boolean) {
    context.save();
    context.clearRect(0, 0, this.width, this.height);
    if(!spiro.visible){
      return;
    }
    context.beginPath();
    var [x, y] = spiro.origin!;
    context.arc(x, y, spiro.size!, 0, 2 * Math.PI);
    context.stroke();
    context.fill();
    if(!last){
      context.beginPath();
      var [ix, iy] = spiro.innerOrigin!;
      context.ellipse(ix, iy, spiro.innerWidthSize!, spiro.innerHeightSize!, spiro.innerOutputRotation!, 0, 2 * Math.PI);
      context.fillStyle = 'white';
      context.stroke();
      context.fill();
      context.restore();
    }
  }

  draw() {
    //Spiros
    if (this.state == State.RUNNING) {
      this.spiros.forEach((s) => console.log(s.canvasContext));
      this.spiros.forEach((spiro, i) => this.drawSpiro(spiro, spiro.canvasContext!, (this.spiros.length - 1) == i));
    } else {
      this.spiroCanvas.forEach((canvas, index) => {
        var spiro = this.spiros[index];
        var context = canvas.nativeElement.getContext('2d')!;
        context.fillStyle = this.hsl(spiro.color_hue, spiro.color_sat, 60);
        context.strokeStyle = this.hsl(spiro.color_hue, spiro.color_sat, 20);
        context.lineWidth = 2;
        context.save();
        this.drawSpiro(spiro, context, (this.spiros.length - 1) == index);
      });
      this.dotContext.clearRect(0, 0, this.width, this.height);
    }
    this.points.forEach(([x, y, color]) => {
      this.dotContext.fillStyle = color;
      this.dotContext.fillRect(x, y, 1, 1);
    });
  }

  actionClicked() {
    if (this.state == State.NOT_RUNNING) {
      this.state = State.RUNNING;
      this.init();
      this.drawingSubscription = interval(this.TPS).subscribe(_ => this.run());
    } else {
      this.drawingSubscription.unsubscribe();
      this.state = State.NOT_RUNNING;
    }
  }
}
