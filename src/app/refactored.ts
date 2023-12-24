import tinycolor from "tinycolor2";

interface BrushCanvasDrawerOptions {
  strokeWidth: number;
  strokeColor: string;
}

export class BrushCanvasDrawer {
  private readonly signaturePoints = Array<Array<{ x: number, y: number }>>();
  private readonly context = this.canvas.getContext("2d") as CanvasRenderingContext2D;

  private latestPoint: any;
  private currentBrush: any;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly options: BrushCanvasDrawerOptions,
    signaturePointsInitData?: Array<Array<{ x: number, y: number }>>
  )
  {
    if (signaturePointsInitData != undefined) {
      this.signaturePoints = signaturePointsInitData
    }
  }

  addNewPointToExistingSeries(x: number, y: number) {
    this.signaturePoints[this.signaturePoints.length - 1].push({ x, y });
  }

  addNewSeries() {
    this.signaturePoints.push(new Array<{ x: number, y: number }>());
  }

  draw() {
    this.currentBrush = this.makeBrush(this.options.strokeWidth);
    this.signaturePoints.forEach((series) => {
      series.forEach((point, index) => {
        if (index === 0) {
          this.startStroke([point.x * this.canvas.width, point.y * this.canvas.height]);
        } else {
          this.continueStroke([point.x * this.canvas.width, point.y * this.canvas.height]);
        }
      });

      this.latestPoint = undefined;
      this.currentBrush = undefined;
    });
  }

  private makeBrush = (size: any) => {
    const brush = [];
    let bristleCount = Math.round(size / 3);
    const gap = this.options.strokeWidth / bristleCount;
    for (let i = 0; i < bristleCount; i++) {
        const distance =
            i === 0 ? 0 : gap * i + (Math.random() * gap) / 2 - gap / 2;
        brush.push({
            distance,
            thickness: Math.random() * 2 + 2,
            color: this.options.strokeColor
        });
    }
    return brush;
  };

  private strokeBristle = (origin: any, destination: any, bristle: any) => {
    this.context.beginPath();
    this.context.moveTo(origin[0], origin[1]);
    this.context.strokeStyle = this.options.strokeColor;
    this.context.lineWidth = bristle.thickness;
    this.context.lineCap = "round";
    this.context.lineJoin = "round";
    this.context.lineTo(destination[0], destination[1]);
    this.context.stroke();
  };

  private drawStroke = (bristles: any, origin: any, destination: any) => {
    bristles.forEach((bristle: any) => {
        this.context.beginPath();
        const bristleOrigin = origin[0] - this.options.strokeWidth / 2 + bristle.distance;

        const bristleDestination = destination[0] - this.options.strokeWidth / 2 + bristle.distance;
        this.strokeBristle(
            [bristleOrigin, origin[1]],
            [bristleDestination, destination[1]],
            bristle.thickness
        );
    });
  };

  private startStroke = (point: any) => {
    this.currentBrush = this.makeBrush(this.options.strokeWidth);
    this.latestPoint = point;
  };

  private continueStroke = (newPoint: any) => {
    this.drawStroke(this.currentBrush, this.latestPoint, newPoint);
    this.latestPoint = newPoint;
  };
}
