import { Injectable } from '@angular/core';
import tinycolor from "tinycolor2";

@Injectable({
  providedIn: 'root'
})
export class CanvasService {
  private htmlCanvasElement!: HTMLCanvasElement;
  private readonly points: Array<{ x: number; y: number; }> = [];

  constructor() { }

  public initialize(canvas: HTMLCanvasElement): void {
    this.htmlCanvasElement = canvas;
  }

  public rainbowSimple(): void {
    const canvasElement = this.htmlCanvasElement;
    const context = canvasElement.getContext("2d")!;

    context.strokeStyle = 'orange';
    context.lineCap = 'round';
    context.lineJoin = 'round';

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let hue = 0;
    let lineWidth = 1;
    // context.globalCompositeOperation = 'difference';

    const frameDuration = 1000 / 120;
    let lastTime = 0;

    const draw = (e: any) => {
      const currentTime = performance.now();
      const timeDiff = currentTime - lastTime;
      if (timeDiff < frameDuration) {
        // requestAnimationFrame(() => draw(e));
        return;
      }

      lastTime = currentTime;

      if (!isDrawing) {
        return;
      }

      context.strokeStyle = getColor();
      context.lineWidth = getlineWidth();

      context.beginPath();
      context.moveTo(lastX, lastY);
      // Smooth line to make it curve
      context.quadraticCurveTo(lastX, lastY, e.offsetX, e.offsetY);
      // context.lineTo(e.offsetX, e.offsetY);
      context.stroke();

      this.points.push({ x: e.offsetX, y: e.offsetY });

      [lastX, lastY] = [e.offsetX, e.offsetY];
    }

    const getColor = () => {
      hue++;
      if ( hue == 360 ) {
        hue = 0;
      }
      return 'hsl(' + hue +', 100%, 50%)';
    }

    const getlineWidth = () => {
      return 20;
      lineWidth++;
      if (lineWidth > 100) {
        lineWidth = 1;
      }
      return lineWidth;
    }

    canvasElement.addEventListener('mousemove', draw);
    canvasElement.addEventListener('mousedown', (e) => {
      isDrawing = true;
      [lastX, lastY] = [e.offsetX, e.offsetY];
    });
    canvasElement.addEventListener('mouseup', () => isDrawing = false );
    canvasElement.addEventListener('mouseout', () => isDrawing = false );
  }

  pointsExperiment() {
    const canvasElement = this.htmlCanvasElement;
    const context = canvasElement.getContext("2d")!;

    let skipCount = 0;
    let maxSkip = 20;
    let isDrawing = false;
    canvasElement.addEventListener("mousedown", e => {
      this.points.push({ x: e.clientX, y: e.clientY });
      this.placePoint(context, e.clientX, e.clientY);

      if (this.points.length > 2 && this.points.length % 2 !== 0) {
        this.drawCurve(context, this.points.length - 1);
      }

      // isDrawing = true;
      // context.moveTo(e.clientX, e.clientY);
    });
    // canvasElement.addEventListener("mousemove", e => {
    //   if (isDrawing === true) {
    //     this.points.push({ x: e.clientX, y: e.clientY });
    //     this.drawCurve(context, e.clientX, e.clientY);
    //   }
    // });
    // canvasElement.addEventListener("mouseup", e => {
    //   isDrawing = false;
    // });
  }

  pointsExperimentVideo(newX: number, newY: number): void {
    const canvasElement = this.htmlCanvasElement;
    const context = canvasElement.getContext("2d")!;

    this.points.push({ x: newX, y: newY });

    this.points.forEach((point, index) => {
      if (index === 0) {
        this.placePoint(context, point.x, point.y);
      } else if (index > 2 && index % 2 !== 0) {
        this.placePoint(context, point.x, point.y);
        this.drawCurve(context, index);
      }
    });

    // isDrawing = true;
    // context.moveTo(e.clientX, e.clientY);
  }

  private placePoint(context: CanvasRenderingContext2D, x: number, y: number) {
    context.beginPath();
    context.arc(x, y, 5, 0, 2 * Math.PI);
    context.fill();
  }

  private draw(context: CanvasRenderingContext2D, x: number, y: number) {
    context.lineTo(x, y);
    context.stroke();
  }

  private drawCurve(context: CanvasRenderingContext2D, pointIndex: number) {
    const startPoint = this.points[pointIndex - 2];
    const controlPoint = this.points[pointIndex - 1];
    const endPoint = this.points[pointIndex];

    context.beginPath();
    context.moveTo(startPoint.x, startPoint.y);
    context.quadraticCurveTo(controlPoint.x, controlPoint.y, endPoint.x, endPoint.y);
    context.stroke();
  }

  internetBrush(): void {
    const canvasElement = this.htmlCanvasElement;
    const context = canvasElement.getContext("2d")!;

    let colour = "#111111";
    const strokeWidth = 30;
    const varyBrightness = 5;

    // Drawing state
    let latestPoint: any;
    let drawing = false;
    let currentAngle: any;

    // Set up our drawing context
    const canvas = canvasElement;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 10;

    const varyColour = (sourceColour: any) => {
        const amount = Math.round(Math.random() * 2 * varyBrightness);
        const c = tinycolor(sourceColour);
        const varied =
            amount > varyBrightness
                ? c.brighten(amount - varyBrightness)
                : c.darken(amount);
        return varied.toHexString();
    };

    const makeBrush = (size: any) => {
        const brush = [];
        let bristleCount = Math.round(size / 3);
        const gap = strokeWidth / bristleCount;
        for (let i = 0; i < bristleCount; i++) {
            const distance =
                i === 0 ? 0 : gap * i + (Math.random() * gap) / 2 - gap / 2;
            brush.push({
                distance,
                thickness: Math.random() * 2 + 2,
                colour: varyColour(colour)
            });
        }
        return brush;
    };

    let currentBrush = makeBrush(strokeWidth);

    // Geometry

    const rotatePoint = (distance: any, angle: any, origin: any) => [
        origin[0] + distance * Math.cos(angle),
        origin[1] + distance * Math.sin(angle)
    ];

    const getBearing = (origin: any, destination: any) =>
        (Math.atan2(destination[1] - origin[1], destination[0] - origin[0]) -
            Math.PI / 2) %
        (Math.PI * 2);

    const getNewAngle = (origin: any, destination: any, oldAngle: any) => {
        const bearing = getBearing(origin, destination);
        if (typeof oldAngle === "undefined") {
            return bearing;
        }
        return oldAngle - angleDiff(oldAngle, bearing);
    };

    const angleDiff = (angleA: any, angleB: any) => {
        const twoPi = Math.PI * 2;
        const diff =
            ((angleA - (angleB > 0 ? angleB : angleB + twoPi) + Math.PI) % twoPi) -
            Math.PI;
        return diff < -Math.PI ? diff + twoPi : diff;
    };

    // Drawing functions

    const strokeBristle = (origin: any, destination: any, bristle: any, controlPoint: any) => {
        context.beginPath();
        context.moveTo(origin[0], origin[1]);
        context.strokeStyle = bristle.colour;
        context.lineWidth = bristle.thickness;
        context.lineCap = "round";
        context.lineJoin = "round";
        context.shadowColor = bristle.colour;
        context.shadowBlur = bristle.thickness / 2;
        context.quadraticCurveTo(
            controlPoint[0],
            controlPoint[1],
            destination[0],
            destination[1]
        );
        context.lineTo(destination[0], destination[1]);
        context.stroke();
    };

    const drawStroke = (bristles: any, origin: any, destination: any, oldAngle: any, newAngle: any) => {
        bristles.forEach((bristle: any) => {
            context.beginPath();
            let bristleOrigin = rotatePoint(
                bristle.distance - strokeWidth / 2,
                oldAngle,
                origin
            );

            let bristleDestination = rotatePoint(
                bristle.distance - strokeWidth / 2,
                newAngle,
                destination
            );
            const controlPoint = rotatePoint(
                bristle.distance - strokeWidth / 2,
                newAngle,
                origin
            );
            bristleDestination = rotatePoint(
                bristle.distance - strokeWidth / 2,
                newAngle,
                destination
            );
            strokeBristle(bristleOrigin, bristleDestination, bristle, controlPoint);
        });
    };
    const continueStroke = (newPoint: any) => {
        const newAngle = getNewAngle(latestPoint, newPoint, currentAngle);
        drawStroke(currentBrush, latestPoint, newPoint, currentAngle, newAngle);
        currentAngle = newAngle % (Math.PI * 2);
        latestPoint = newPoint;
    };
    // Event helpers

    const startStroke = (point: any) => {
        colour = "#ff0000"
        currentAngle = undefined;
        currentBrush = makeBrush(strokeWidth);
        drawing = true;
        latestPoint = point;
    };

    const BUTTON = 0b01;
    const mouseButtonIsDown = (buttons: any) => (BUTTON & buttons) === BUTTON;

    // Event handlers

    const frameDuration = 1000 / 120;
    let lastTime = 0;

    const mouseMove = (evt: any) => {
        if (!drawing) {
            return;
        }

        const currentTime = performance.now();
        const timeDiff = currentTime - lastTime;
        if (timeDiff < frameDuration) {
          return;
        }
        lastTime = currentTime;

        continueStroke([evt.offsetX, evt.offsetY]);
    };

    const mouseDown = (evt: any) => {
        if (drawing) {
            return;
        }
        evt.preventDefault();
        canvas.addEventListener("mousemove", mouseMove, false);
        startStroke([evt.offsetX, evt.offsetY]);
    };

    const mouseEnter = (evt: any) => {
        if (!mouseButtonIsDown(evt.buttons) || drawing) {
            return;
        }
        mouseDown(evt);
    };

    const endStroke = (evt: any) => {
        if (!drawing) {
            return;
        }
        drawing = false;
        evt.currentTarget.removeEventListener("mousemove", mouseMove, false);
    };

    canvas.addEventListener("mousedown", mouseDown, false);
    canvas.addEventListener("mouseup", endStroke, false);
    canvas.addEventListener("mouseout", endStroke, false);
    canvas.addEventListener("mouseenter", mouseEnter, false);
  }
}
