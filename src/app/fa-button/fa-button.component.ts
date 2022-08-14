import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IconName } from '@fortawesome/fontawesome-svg-core';

@Component({
  selector: 'fa-button',
  templateUrl: './fa-button.component.html',
  styleUrls: ['./fa-button.component.css']
})
export class FaButtonComponent implements OnInit {

  @Input()
  type !: string;
  
  @Input()
  icon !: IconName;

  @Output()
  clicked : EventEmitter<void> = new EventEmitter();

  @Input()
  name !: string;

  @Input()
  disable : boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

}
