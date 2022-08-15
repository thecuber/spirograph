import { Injectable } from '@angular/core';
import { Spiro } from './model';
import { saveAs } from 'file-saver';
import { from, fromEvent, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileService {

  constructor() { }

  exportFile(spiros: Spiro[]) {
    var txt = "";
    spiros.forEach((spiro) => {
      const tab = ['S', spiro.outerSize, spiro.innerWidth, spiro.innerHeight, spiro.innerXDelta, spiro.innerAngleDelta, spiro.color_hue, spiro.color_sat]
      txt += tab.join('/') + '\n';
      spiro.pens.forEach((pen) => {
        txt += ['P', pen.color, pen.angle, pen.ray].join('/') + '\n';
      })
    });
    saveAs(new Blob([txt], { type: "text/plain;charset=utf-8" }), "spirograph.spiro");
  }

  fileUploaded(file: File): Observable<[Spiro[], string]> {
    return new Observable((subscribe) => {
      var reader = new FileReader();
      reader.onload = () => {
        var arr: Spiro[] = [];
        var lines = reader.result?.toString().split('\n');
        var spiro: Spiro | undefined;
        lines!.forEach((line) => {
          if (line.length > 0) {
            if (line.charAt(0) == 'S') {
              var [outerSize, innerWidth, innerHeight, innerXDelta, innerAngleDelta, color_hue, color_sat] = line.slice(2).split('/');
              spiro = {
                outerSize: parseFloat(outerSize),
                innerWidth: parseFloat(innerWidth),
                innerHeight: parseFloat(innerHeight),
                innerXDelta: parseFloat(innerXDelta),
                innerAngleDelta: parseFloat(innerAngleDelta),
                color_hue: parseFloat(color_hue),
                color_sat: parseFloat(color_sat),
                pens: [],
                visible: true,
                innerRotation: 0,
                outerRotation: 0
              }
              arr.push(spiro);
            } else if (line.charAt(0) == 'P') {
              var [color, angle, ray] = line.slice(2).split('/');
              spiro!.pens.push({color: color, angle: parseFloat(angle), ray: parseFloat(ray)});
            }
          }
        });
        subscribe.next([arr, file.name]);
        subscribe.complete();
      };
      reader.readAsText(file);
    });
  }


}
