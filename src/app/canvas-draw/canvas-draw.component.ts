import { Component, OnInit, inject } from '@angular/core';
import { CanvasService } from '../canvas.service';

@Component({
  selector: 'app-canvas-draw',
  standalone: true,
  imports: [],
  templateUrl: './canvas-draw.component.html',
  styleUrl: './canvas-draw.component.scss'
})
export class CanvasDrawComponent implements OnInit {
  private canvasService: CanvasService = inject(CanvasService);

  ngOnInit() {
    const canvasElement = document.getElementById(
      "output_canvas"
    ) as HTMLCanvasElement;

    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;

    this.canvasService.initialize(canvasElement);
    this.canvasService.internetBrush();
  }
}
