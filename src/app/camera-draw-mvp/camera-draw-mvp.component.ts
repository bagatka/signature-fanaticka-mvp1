import { Component, OnInit, inject } from '@angular/core';

import { HandLandmarker, FilesetResolver, HandLandmarkerResult, DrawingUtils } from '@mediapipe/tasks-vision';
import { CanvasService } from '../canvas.service';
import { BrushCanvasDrawer } from '../refactored';


@Component({
  selector: 'app-camera-draw-mvp',
  standalone: true,
  imports: [],
  templateUrl: './camera-draw-mvp.component.html',
  styleUrl: './camera-draw-mvp.component.scss'
})
export class CameraDrawMvpComponent implements OnInit {
  private readonly signaturePoints = Array<Array<{ x: number, y: number, timestamp: number }>>();
  private currentSignaturePointsIndex = -1;

  public clearSignature() {
    this.signaturePoints.length = 0;
    this.currentSignaturePointsIndex = -1;
  }

  public ngOnInit() {
    const demosSection = document.getElementById("demos");

    let handLandmarker: HandLandmarker | undefined = undefined;
    let runningMode = "IMAGE" as "IMAGE" | "VIDEO";
    let enableWebcamButton: HTMLButtonElement;
    let webcamRunning: Boolean = false;

    const createHandLandmarker = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `assets/ml-models/hand_landmarker.task`,
          delegate: "GPU"
        },
        runningMode: runningMode,
        numHands: 2
      });
      demosSection?.classList.remove("invisible");
    };
    createHandLandmarker();

    const video = document.getElementById("webcam") as HTMLVideoElement;
    const canvasElement = document.getElementById(
      "output_canvas"
    ) as HTMLCanvasElement;
    const canvasCtx = canvasElement.getContext("2d") as CanvasRenderingContext2D;

    const drawingUtils = new DrawingUtils(canvasCtx);

    // Check if webcam access is supported.
    const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;

    // If webcam supported, add event listener to button for when user
    // wants to activate it.
    if (hasGetUserMedia()) {
      enableWebcamButton = document.getElementById("webcamButton") as HTMLButtonElement;
      enableWebcamButton.addEventListener("click", enableCam);
    } else {
      console.warn("getUserMedia() is not supported by your browser");
    }

    // Enable the live webcam view and start detection.
    function enableCam() {
      if (!handLandmarker) {
        console.log("Wait! objectDetector not loaded yet.");
        return;
      }

      if (webcamRunning === true) {
        webcamRunning = false;
        enableWebcamButton.innerText = "ENABLE PREDICTIONS";
      } else {
        webcamRunning = true;
        enableWebcamButton.innerText = "DISABLE PREDICTIONS";
      }

      // getUsermedia parameters.
      const constraints = {
          video: {
            width: { exact: 1920 },
            height: { exact: 1080 },
            facingMode: { ideal: "environment" },
            frameRate: { ideal: 50 }
        }
      };

      // Activate the webcam stream.
      navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        video.srcObject = stream;
        video.addEventListener("loadeddata", predictWebcam);
      });
    }

    let lastVideoTime = -1;
    let results: HandLandmarkerResult | undefined = undefined;
    let angularComponent = this;
    async function predictWebcam() {
      canvasElement.style.width = video.videoWidth.toString();
      canvasElement.style.height = video.videoHeight.toString();
      canvasElement.width = video.videoWidth;
      canvasElement.height = video.videoHeight;
      video.style.transform = "scaleX(-1)";
      canvasElement.style.transform = "scaleX(-1)";

      // Now let's start detecting the stream.
      if (runningMode === "IMAGE") {
        runningMode = "VIDEO";
        await handLandmarker?.setOptions({ runningMode: "VIDEO" });
      }
      let startTimeMs = performance.now();
      if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        results = handLandmarker?.detectForVideo(video, startTimeMs);
      }
      canvasCtx.save();
      const index_finger_tip = results?.landmarks?.at(0)?.at(8);
      const thumb_tip = results?.landmarks?.at(0)?.at(4);

      // if both index finger tip and thumb tip are close enough

      if (index_finger_tip && thumb_tip) {
        const distance = Math.sqrt(Math.pow(index_finger_tip.x - thumb_tip.x, 2) + Math.pow(index_finger_tip.y - thumb_tip.y, 2));
        if (distance < 0.04) {
          if (angularComponent.currentSignaturePointsIndex === -1) {
            angularComponent.currentSignaturePointsIndex = 0;
          }

          if (angularComponent.signaturePoints.at(angularComponent.currentSignaturePointsIndex) === undefined) {
            angularComponent.signaturePoints[angularComponent.currentSignaturePointsIndex] = new Array<{ x: number, y: number, timestamp: number }>();
          }
          angularComponent.signaturePoints.at(angularComponent.currentSignaturePointsIndex)?.push({ x: index_finger_tip.x, y: index_finger_tip.y, timestamp: startTimeMs });
        } else {
          if (angularComponent.currentSignaturePointsIndex !== -1) {
            if (angularComponent.signaturePoints[angularComponent.currentSignaturePointsIndex] !== undefined) {
              angularComponent.currentSignaturePointsIndex++;
            }
          }
        }
      } else {
        if (angularComponent.currentSignaturePointsIndex === -1) {
        }

        if (angularComponent.currentSignaturePointsIndex !== -1) {
          if (angularComponent.signaturePoints[angularComponent.currentSignaturePointsIndex] !== undefined) {
            angularComponent.currentSignaturePointsIndex++;
          }
        }
      }

      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      // if (results?.landmarks) {
      //   for (const landmarks of results.landmarks) {
      //     drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
      //       color: "#00FF00",
      //       lineWidth: 5
      //     });
      //     drawingUtils.drawLandmarks(landmarks, { color: "#FF0000", lineWidth: 2 });
      //   }
      // }
      canvasCtx.restore();
      canvasCtx.lineWidth = 10;
      /*angularComponent.signaturePoints.forEach((signaturePoints) => {
        signaturePoints.forEach((point, index) => {
          // canvasCtx.beginPath();
          // canvasCtx.arc(point.x * canvasElement.width, point.y * canvasElement.height, 5, 0, 2 * Math.PI);
          // canvasCtx.fill();

          if (index < 2) {
            return;
          }

          if (index > 2 && index % 2 !== 0) {
            const startPoint = signaturePoints[index - 2];
            const controlPoint = signaturePoints[index - 1];

            canvasCtx.beginPath();
            canvasCtx.moveTo(startPoint.x * canvasElement.width, startPoint.y * canvasElement.height);
            canvasCtx.quadraticCurveTo(controlPoint.x * canvasElement.width, controlPoint.y * canvasElement.height, point.x * canvasElement.width, point.y * canvasElement.height);
            canvasCtx.stroke();
          }
        });
      });*/

      // console.log(angularComponent.signaturePoints);
      // let points = angularComponent.signaturePoints.at(-1)!;
      // console.log('Points', points);


      // if (points === undefined) {
      //   return;
      // }

      // console.log(points);
      // if (points.length > 60) {
      //   // take last 15 of them
      //   points = points.slice(-60);
      // }

      const bCD = new BrushCanvasDrawer(
        canvasElement,
        {
          strokeWidth: 20,
          strokeColor: "#d94520"
        },
        // points === undefined ? angularComponent.signaturePoints : [points]
        angularComponent.signaturePoints
      );
      bCD.draw();

      // Call this function again to keep predicting when the browser is ready.
      if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
      }
    }
  }
}
