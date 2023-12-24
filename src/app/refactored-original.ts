import tinycolor from "tinycolor2";

interface BrushCanvasDrawerOptions {
  strokeWidth: number;
  strokeColor: string;
  strokeColorVariance: number;
}

export class BrushCanvasDrawer {
  private readonly signaturePoints = Array<Array<{ x: number, y: number }>>();
  private readonly context = this.canvas.getContext("2d") as CanvasRenderingContext2D;

  private latestPoint: any;
  private currentAngle: any;
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
      this.currentAngle = undefined;
      this.currentBrush = undefined;
    });
  }

  private varyColor = (sourceColour: any) => {
    const amount = Math.round(Math.random() * 2 * this.options.strokeColorVariance);
    const c = tinycolor(sourceColour);
    const varied =
        amount > this.options.strokeColorVariance
            ? c.brighten(amount - this.options.strokeColorVariance)
            : c.darken(amount);
    return varied.toHexString();
  };

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
            color: this.varyColor(this.options.strokeColor)
        });
    }
    return brush;
  };

  private rotatePoint = (distance: any, angle: any, origin: any) => [
    origin[0] + distance * Math.cos(angle),
    origin[1] + distance * Math.sin(angle)
  ];

  private getBearing = (origin: any, destination: any) => (Math.atan2(destination[1] - origin[1], destination[0] - origin[0]) - Math.PI / 2) % (Math.PI * 2);

  private getNewAngle = (origin: any, destination: any, oldAngle: any) => {
    const bearing = this.getBearing(origin, destination);
    if (oldAngle === undefined) {
        return bearing;
    }
    return oldAngle - this.angleDiff(oldAngle, bearing);
  };

  private angleDiff = (angleA: any, angleB: any) => {
    const twoPi = Math.PI * 2;
    const diff = ((angleA - (angleB > 0 ? angleB : angleB + twoPi) + Math.PI) % twoPi) - Math.PI;
    return diff < -Math.PI ? diff + twoPi : diff;
  };

  private strokeBristle = (origin: any, destination: any, bristle: any, controlPoint: any) => {
    this.context.beginPath();
    this.context.moveTo(origin[0], origin[1]);
    this.context.strokeStyle = bristle.colour;
    this.context.lineWidth = bristle.thickness;
    this.context.lineCap = "round";
    this.context.lineJoin = "round";
    this.context.shadowColor = bristle.colour;
    this.context.shadowBlur = bristle.thickness / 2;
    this.context.quadraticCurveTo(
        controlPoint[0],
        controlPoint[1],
        destination[0],
        destination[1]
    );
    this.context.lineTo(destination[0], destination[1]);
    this.context.stroke();
  };

  private drawStroke = (bristles: any, origin: any, destination: any, oldAngle: any, newAngle: any) => {
    bristles.forEach((bristle: any) => {
        this.context.beginPath();
        let bristleOrigin = this.rotatePoint(
            bristle.distance - this.options.strokeWidth / 2,
            oldAngle,
            origin
        );

        let bristleDestination = this.rotatePoint(
            bristle.distance - this.options.strokeWidth / 2,
            newAngle,
            destination
        );
        const controlPoint = this.rotatePoint(
            bristle.distance - this.options.strokeWidth / 2,
            newAngle,
            origin
        );
        this.strokeBristle(bristleOrigin, bristleDestination, bristle, controlPoint);
    });
  };

  private continueStroke = (newPoint: any) => {
    const newAngle = this.getNewAngle(this.latestPoint, newPoint, this.currentAngle);
    this.drawStroke(this.currentBrush, this.latestPoint, newPoint, this.currentAngle, newAngle);
    this.currentAngle = newAngle % (Math.PI * 2);
    this.latestPoint = newPoint;
  };

  private startStroke = (point: any) => {
    this.currentAngle = undefined;
    this.currentBrush = this.makeBrush(this.options.strokeWidth);
    this.latestPoint = point;
  };
}
