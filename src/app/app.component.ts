import { ChangeContext } from '@angular-slider/ngx-slider';
import { Component, createPlatform, ElementRef, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import * as FileSaver from 'file-saver';
import { ToastrService } from 'ngx-toastr';
import { interval, Subscription } from 'rxjs';
import { FileService } from './file.service';
import { Pen, Spiro, State } from './model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

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
  freshPoints: [number, number, string][] = [];

  state: State = State.NOT_RUNNING;

  showAll: boolean = true;
  showGear: boolean = true;
  animSpeed: number = 1;

  GLOBAL_DENT = 100;
  GEAR_PERCENTAGE = 0.05;

  color: any;

  constructor(private toastrService: ToastrService, private fileService: FileService) { }

  ngOnInit() {
    this.addSpiro();
    this.width = this.wrapperCanvas.nativeElement.width;
    this.height = this.wrapperCanvas.nativeElement.height;
    this.dotContext = this.dotCanvas.nativeElement.getContext('2d')!;
  }

  isRunning() {
    return this.state == State.RUNNING;
  }

  addSpiro() {
    this.spiros.push({
      color_hue: Math.floor(Math.random() * 361),
      color_sat: Math.floor(Math.random() * 100),
      outerSize: 0.5,
      innerWidth: 0.5,
      innerHeight: 0.25,
      innerXDelta: 0,
      innerAngleDelta: 0,
      innerRotation: 0,
      outerRotation: 0,
      pens: [],
      visible: true
    });
    setTimeout(() => this.settingsModified(), 20);
  }

  removeSpiro() {
    this.spiros.pop();
    setTimeout(() => this.settingsModified(), 20);
  }

  setVisible(spiro: Spiro) {
    spiro.visible = !spiro.visible;
    this.settingsModified();
  }

  getPoint(x: number, y: number, ray: number, angle: number): [number, number] {
    return [x + ray * Math.cos(angle), y + ray * Math.sin(angle)];
  }

  getEllipsePoint(ox: number, oy: number, a: number, b: number, theta: number, parent: number): [number, number] {
    var x = a * b * Math.cos(theta) / Math.sqrt(Math.pow((a * Math.sin(theta)), 2) + Math.pow(b * Math.cos(theta), 2));
    var y = a * b * Math.sin(theta) / Math.sqrt(Math.pow((a * Math.sin(theta)), 2) + Math.pow(b * Math.cos(theta), 2));
    return [ox + x * Math.cos(parent) - y * Math.sin(parent), oy + y * Math.cos(parent) + x * Math.sin(parent)];
  }

  hsl(hue: number, sat: number, light: number): string {
    return 'hsl(' + hue + ',' + sat + '%,' + light + '%)';
  }

  settingsModified() {
    if(this.state == State.NOT_RUNNING){
      this.freshPoints = [];
      this.points = [];
    }
    this.update();
    var ctx = this.wrapperCanvas.nativeElement.getContext('2d')!;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.beginPath();
    if(this.showGear){
      this.drawEllipseGear(this.width / 2, this.height / 2, this.width / 2, this.height / 2, ctx, 0, 0);
    }else{
      ctx.arc(this.width / 2, this.height / 2, this.width / 2, 0, 2 * Math.PI);
      ctx.stroke();
    }
    this.draw();
  }

  init() {
    this.spiroCanvas.forEach((canvas, index) => {
      var spiro = this.spiros[index];
      var context = canvas.nativeElement.getContext('2d')!;
      context.fillStyle = this.hsl(spiro.color_hue, spiro.color_sat, 60);
      context.strokeStyle = this.hsl(spiro.color_hue, spiro.color_sat, 20);
      context.lineWidth = 2;
      spiro.canvasContext = context;
    });
    this.points = [];
    this.freshPoints = [];
    this.dotContext.clearRect(0, 0, this.width, this.height);
  }

  run() {
    this.freshPoints = [];
    for (var i = 0; i < this.animSpeed * 5; i++) {
      this.move();
      this.update();
    }
    this.draw();
  }

  move() {
    const OMEGA = 0.1;
    for (var i = this.spiros.length - 1; i >= 0; i--) {
      var spiro = this.spiros[i];
      spiro.innerRotation += (OMEGA / spiro.outerSize) * this.TPS / 1000;
      spiro.outerRotation -= OMEGA * this.TPS / 1000;
    }
  }

  update() {
    var [originx, originy] = [this.width / 2, this.height / 2];
    var parentRotation = 0;
    var rayWidth = this.width / 2;
    var rayHeight = this.height / 2;
    this.spiros.forEach((spiro) => {
      //TODO FIX CETTE MERDE
      var min = Math.min(rayWidth, rayHeight);
      [originx, originy] = this.getEllipsePoint(originx, originy, rayWidth - min * spiro.outerSize, rayHeight - min * spiro.outerSize, spiro.outerRotation, parentRotation);
      spiro.origin = [originx, originy];
      rayWidth = min * spiro.outerSize;
      rayHeight = rayWidth;
      spiro.size = rayWidth;
      parentRotation += spiro.outerRotation;
      parentRotation += spiro.innerRotation;
      spiro.pens.forEach((pen) => {
        var [penx, peny] = this.getPoint(originx, originy, rayWidth * pen.ray, pen.angle + parentRotation);
        this.freshPoints.push([penx, peny, pen.color]);
      });
      spiro.innerWidthSize = spiro.size * spiro.innerWidth;
      spiro.innerHeightSize = spiro.size * spiro.innerHeight;
      [originx, originy] = this.getPoint(originx, originy, rayWidth * spiro.innerXDelta * (1 - Math.max(spiro.innerWidth, spiro.innerHeight)), parentRotation);
      spiro.innerOrigin = [originx, originy];
      parentRotation += spiro.innerAngleDelta;
      spiro.innerOutputRotation = parentRotation;
      rayWidth *= spiro.innerWidth;
      rayHeight *= spiro.innerHeight;
    });

  }

  /**
   * 
   * @param x center of the circle
   * @param y center of the circle
   * @param ray length of the circle
   * @param context context to draw
   * @param angle the angle of the container
   * @param ratio size ratio between parent and children
   */
  drawCircleGear(x: number, y: number, ray: number, context: CanvasRenderingContext2D, angle: number, ratio: number) {
    const NDENT = this.GLOBAL_DENT * ratio;
    var theta_esp = 2 * Math.PI / NDENT;
    var croppedWidth = ray - ray / ratio * this.GEAR_PERCENTAGE;
    var [xl, yl] = this.getPoint(x, y, croppedWidth, -1 / 2 * theta_esp + angle);
    context.moveTo(xl, yl);
    for (var i = 0; i < NDENT; i++) {
      var [xm, ym] = this.getPoint(x, y, ray, i * theta_esp + angle);
      var [xr, yr] = this.getPoint(x, y, croppedWidth, (i + 1 / 2) * theta_esp + angle);
      context.lineTo(xm, ym);
      context.lineTo(xr, yr);
    }
    context.closePath();
    context.stroke();
    context.fill();
  }

  drawEllipseGear(x: number, y: number, width: number, height: number, context: CanvasRenderingContext2D, angle: number, parent: number) {
    var theta_esp = 2 * Math.PI / this.GLOBAL_DENT;
    var croppedLength = Math.min(width, height) * this.GEAR_PERCENTAGE;
    var [xl, yl] = this.getEllipsePoint(x, y, width - croppedLength, height - croppedLength, -1 / 2 * theta_esp + angle, parent);
    context.moveTo(xl, yl);
    for (var i = 0; i < this.GLOBAL_DENT; i++) {
      var [xm, ym] = this.getEllipsePoint(x, y, width, height, i * theta_esp + angle, parent);
      var [xr, yr] = this.getEllipsePoint(x, y, width - croppedLength, height - croppedLength, (i + 1 / 2) * theta_esp + angle, parent);
      context.lineTo(xm, ym);
      context.lineTo(xr, yr);
    }
    context.closePath();
    context.stroke();
  }

  drawSpiro(spiro: Spiro, context: CanvasRenderingContext2D, last: boolean) {
    context.save();
    context.clearRect(0, 0, this.width, this.height);
    if (!spiro.visible) {
      return;
    }
    context.beginPath();
    var [x, y] = spiro.origin!;
    if (this.showGear) {
      this.drawCircleGear(x, y, spiro.size!, context, spiro.innerRotation!, spiro.outerSize);
    } else {
      context.arc(x, y, spiro.size!, 0, 2 * Math.PI);
      context.stroke();
      context.fill();
    }
    if (!last) {
      context.beginPath();
      var [ix, iy] = spiro.innerOrigin!;
      context.fillRect(ix, iy, 2, 2);
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
    this.freshPoints.forEach(([x, y, color]) => {
      this.dotContext.fillStyle = color;
      var size = this.state == State.NOT_RUNNING ? 5 : 1;
      this.dotContext.fillRect(x, y, size, size);
      this.points.push([x, y, color]);
    });
  }

  actionClicked() {
    if (this.state == State.NOT_RUNNING) {
      if(this.points.length > 0){
        this.state = State.RUNNING;
        this.selectedCircle = -1;
        this.init();
        this.drawingSubscription = interval(this.TPS).subscribe(_ => this.run());
      }else{
        this.toastrService.warning('No pens are used, please add one by going into a spirograph menu.', 'Pen missing');
      }
      
    } else {
      this.drawingSubscription.unsubscribe();
      this.state = State.NOT_RUNNING;
    }
  }

  reset() {
    this.points = [];
    this.spiros.forEach((s) => {
      s.innerRotation = 0;
      s.outerRotation = 0;
    })
    this.settingsModified();
  }

  showAllClicked() {
    this.spiros.forEach((s) => s.visible = this.showAll);
    this.showAll = !this.showAll;
    this.settingsModified();
  }

  gearChange() {
    this.showGear = !this.showGear;
    this.settingsModified();
  }

  caretClicked(index: number){
    if(this.state != State.RUNNING){
      this.selectedCircle = (this.selectedCircle == index) ? -1 : index;
    }
  }

  addPen(spiro: Spiro){
   var color = '#';
   const list = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
    for(var _ = 0; _ < 6; _++){
      color += list[Math.floor(Math.random() * list.length)];
    }
    spiro.pens.push({
      color: color,
      ray: 0.5,
      angle: 0
    });
    this.settingsModified();
  }

  removePen(spiro: Spiro, pen: Pen){
    spiro.pens = spiro.pens.filter((p) => p != pen);
    this.settingsModified();
  }

  fileUploaded($event: any){
    var file:File = $event.target.files[0];
    this.fileService.fileUploaded(file).subscribe(([spiros, name]) => {
      this.spiros = spiros;
      this.toastrService.success('Successfully imported file ' + name, 'File import');
      setTimeout(() => this.settingsModified(), 50);
    })
  }

  exportData(){
    this.fileService.exportFile(this.spiros);
  }

}
