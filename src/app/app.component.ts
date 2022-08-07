import { Options } from '@angular-slider/ngx-slider';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { interval, Observable, Subscription } from 'rxjs';
import { Point, Spiro, State } from './model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  spiros: Spiro[] = [];
  selectedCircle: number = -1;

  @ViewChild('canvas', { static: true })
  canvas !: ElementRef<HTMLCanvasElement>;

  ctx !: CanvasRenderingContext2D;

  drawing_timeout: number = 1000/60;

  drawingSubscription !: Subscription;

  isDrawing: boolean = false;

  points: [number, number][] = [];

  state: State = State.NOT_RUNNING;

  constructor() {
  }

  ngOnInit() {
    this.addSpiro();
    this.ctx = this.canvas.nativeElement.getContext('2d')!;
    this.draw();
  }

  addSpiro() {
    var spiro = {
      color_hue: Math.floor(Math.random() * 361),
      color_sat: Math.floor(Math.random() * 100),
      color_light: 20,
      outerSize: 51,
      innerWidthSize: 25,
      innerHeightSize: 25,
      innerXDelta: 10,
      innerAngleDelta: 0,
      innerRotation: 0,
      outerRotation: 0,
      pens: [{ color: [255, 0, 0], angle: 0, ray: 70 }]
    };
    this.spiros.push(spiro);
  }

  sliderOptions(min: number, max: number): Options {
    return {
      floor: min,
      ceil: max
    };
  }

  move_origin(x: number, y: number, ray: number, angle: number): [number, number] {
    return [x + ray * Math.cos(angle), y + ray * Math.sin(angle)];
  }

  hsl(hue: number, sat: number, light: number): string{
    console.log('hsl(' + hue + ',' + sat + '%,' + light + '%)');
    return 'hsl(' + hue + ',' + sat + '%,' + light + '%)'; 
  }

  

  run(){

  }

  move(){

  }

  update(){

  }

  draw() {
    const width = this.canvas.nativeElement.width;
    const height = this.ctx.canvas.height;
    this.ctx.clearRect(0, 0, width, height);
    //axis orientation: x -> right, y -> bottom
    var originx = width / 2, originy = height / 2;
    var parentRotation = 0;
    var ray = width / 2;
    this.ctx.beginPath();
    this.ctx.arc(originx, originy, ray, 0, 2 * Math.PI, false);
    this.ctx.stroke();
    for (var i = 0; i < this.spiros.length; i++) {
      var spiro = this.spiros[i];
      //We first draw the outer shape of the spiro, which is a circle
      parentRotation += spiro.outerRotation * Math.PI / 180;
      [originx, originy] = this.move_origin(originx, originy, ray * (1 - spiro.outerSize / 100), parentRotation);
      this.ctx.beginPath();
      this.ctx.arc(originx, originy, ray * spiro.outerSize / 100, 0, 2 * Math.PI, false);
      this.ctx.strokeStyle = this.hsl(spiro.color_hue, spiro.color_sat, 20);
      this.ctx.fillStyle = this.hsl(spiro.color_hue, spiro.color_sat, 60);
      this.ctx.lineWidth = 2;
      this.ctx.fill();
      this.ctx.stroke();
      ray *= spiro.outerSize / 100;
      parentRotation += spiro.innerRotation * Math.PI / 180; 
      //We then draw the pens point
      spiro.pens.forEach((pen) => {
        var [penx, peny] = this.move_origin(originx, originy, ray * pen.ray / 100, pen.angle + parentRotation);
        console.log(originx, originy, penx, peny, pen.ray);
        if (this.points.indexOf([penx, peny]) == -1) {
          console.log("Adding");
          this.points.push([penx, peny]);
        }
      });
      //Then if there is still a circle we draw the inner circle
    }
    this.points.forEach(([x, y]) => {
      this.ctx.fillStyle = 'black';
      this.ctx.fillRect(x, y, 2, 2);
    });
  }

  actionClicked() {
    if (this.state == State.NOT_RUNNING) {
      this.state = State.RUNNING;
      const OMEGA = 100;
      this.drawingSubscription = interval(this.drawing_timeout).subscribe(_ => {
          for (var i = this.spiros.length - 1; i >= 0; i--) {
            var spiro = this.spiros[i];
            spiro.innerRotation += OMEGA * this.drawing_timeout / 1000;
            spiro.outerRotation -= (spiro.outerSize / 100) * OMEGA * this.drawing_timeout / 1000;
          }
          this.draw();
      });
    } else {
      this.drawingSubscription.unsubscribe();
      this.state = State.NOT_RUNNING;
    }
  }

  /*start() {
    this.isDrawing = true;
    const OMEGA = 500;
    this.drawing = interval(this.drawing_timeout).subscribe(_ => {
      for (var i = this.spiros.length - 1; i >= 0; i--) {
        var spiro = this.spiros[i];
        spiro.innerRotation += OMEGA * this.drawing_timeout / 1000;
        spiro.outerRotation -= (spiro.outerSize / 100) * OMEGA * this.drawing_timeout / 1000;
      }
      for (var i = 0; i < this.spiros.length; i++) {
        var spiro = this.spiros[i];
        for (var j = 0; j < spiro.pens.length; j++) {
          var pen = spiro.pens[j];
          var pendiv = document.getElementById('pen' + i + '-' + j);
          const rect = pendiv?.getBoundingClientRect();
          if (rect) {
            var point = { left: rect?.left, top: rect?.top, color: 'red' };
            this.points.push(point);
          }
        }
      }
    });
  }*/
}
