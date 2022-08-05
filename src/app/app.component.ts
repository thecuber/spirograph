import { Options } from '@angular-slider/ngx-slider';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { interval, Observable, Subscription } from 'rxjs';
import { Point, Spiro } from './model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  spiros: Spiro[] = [];
  selectedCircle: number = -1;

  @ViewChild('canvas', {static: true})
  canvas !: ElementRef<HTMLCanvasElement>;

  drawing_timeout: number = 1;

  drawing !: Subscription;

  isDrawing: boolean = false;

  points: Point[] = [];



  Math: Math = Math;
  constructor() {
    this.addSpiro();
  }

  addSpiro() {
    var spiro = {
      color_hue: Math.floor(this.Math.random() * 361),
      color_sat: this.Math.floor(this.Math.random() * 100),
      color_light: 20,
      outerSize: 30,
      innerWidthSize: 25,
      innerHeightSize: 25,
      innerXDelta: 10,
      innerAngleDelta: 0,
      innerRotation: 0,
      outerRotation: 0,
      pens: [{ color: [255, 0, 0], angle: 0, ray: 95 }]
    };
    this.spiros.push(spiro);
  }

  sliderOptions(min: number, max: number): Options {
    return {
      floor: min,
      ceil: max
    };
  }

  draw(){

  }

  start() {
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
  }

  stop() {
    this.isDrawing = false;
    this.drawing.unsubscribe();
  }

}
