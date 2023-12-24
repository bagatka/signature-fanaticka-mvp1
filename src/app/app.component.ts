import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { CanvasDrawComponent } from "./canvas-draw/canvas-draw.component";
import { CameraDrawComponent } from "./camera-draw/camera-draw.component";
import { CameraDrawMvpComponent } from "./camera-draw-mvp/camera-draw-mvp.component";

@Component({
    selector: 'app-root',
    standalone: true,
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    imports: [CommonModule, RouterOutlet, CanvasDrawComponent, CameraDrawComponent, CameraDrawMvpComponent]
})
export class AppComponent {
}
