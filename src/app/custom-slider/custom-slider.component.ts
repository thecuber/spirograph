import { Options } from '@angular-slider/ngx-slider';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-custom-slider',
  templateUrl: './custom-slider.component.html',
  styleUrls: ['./custom-slider.component.css']
})
export class CustomSliderComponent implements OnInit, OnChanges {

  formattedValue : number = 0;

  @Input()
  type!: string;

  @Input()
  value: any;

  @Output()
  valueChange = new EventEmitter();

  @Output()
  change = new EventEmitter();

  options!: Options;

  constructor() { }
  ngOnChanges(changes: SimpleChanges): void {
    if(changes['type'].firstChange){
      this.setOptions(changes['type'].currentValue);
    }
    if(changes['value']){
      this.format(changes['value'].currentValue);
    }
  }

  setOptions(type: Type){
    if(type == Type.ANGLE){
      this.options = {floor: 0, ceil: 360};
    }else{
      this.options = {floor: 0, ceil: 100};
    }
  }

  ngOnInit(): void {
  }

  format(value: number){
    if(this.type == Type.ANGLE){
      this.formattedValue = value * 180 / Math.PI;
    }else{
      this.formattedValue = value * 100;
    }
  }

  unformat($event: number){
    if(this.type == Type.ANGLE){
      this.value = $event / 180 * Math.PI;
    }else{
      this.value = $event / 100;
    }
    this.valueChange.emit(this.value);
    this.change.emit();
  }

}


export enum Type{
  RATIO = 'ratio',
  ANGLE = 'angle'
}
