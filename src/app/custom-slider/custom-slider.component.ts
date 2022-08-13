import { ChangeContext, Options } from '@angular-slider/ngx-slider';
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

  date : number = Date.now();

  constructor() { }
  ngOnChanges(changes: SimpleChanges): void {
  
    if(changes['type'] && changes['type'].firstChange){
      this.setOptions(changes['type'].currentValue);
    }
    if(changes['value'] && (changes['value'].firstChange || (Date.now() - this.date) > 100)){
      this.format(changes['value'].currentValue);
    }
  }

  setOptions(type: Type){
    if(type == Type.ANGLE){
      this.options = {floor: 0, ceil: 360};
    }else{
      this.options = {floor: 0, ceil: 100, maxLimit: 95};
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

  unformat($event: ChangeContext){
    var v = $event.value;
    if(this.type == Type.ANGLE){
      v = v / 180 * Math.PI;
    }else{
      v = v / 100;
    }
    this.valueChange.emit(v);
    this.change.emit();
    this.date = Date.now();
  }

}


export enum Type{
  RATIO = 'ratio',
  ANGLE = 'angle'
}
