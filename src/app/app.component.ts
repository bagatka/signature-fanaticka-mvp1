import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { HandLandmarker, FilesetResolver, HandLandmarkerResult, DrawingUtils } from '@mediapipe/tasks-vision';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private readonly signaturePoints = Array<Array<{ x: number, y: number }>>();
  private currentSignaturePointsIndex = -1;

  public ngOnInit() {
    const demosSection = document.getElementById("demos");

    let handLandmarker: HandLandmarker | undefined = undefined;
    let runningMode = "IMAGE" as "IMAGE" | "VIDEO";
    let enableWebcamButton: HTMLButtonElement;
    let webcamRunning: Boolean = false;

    // Before we can use HandLandmarker class we must wait for it to finish
    // loading. Machine Learning models can be large and take a moment to
    // get everything needed to run.
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

    /********************************************************************
    // Demo 2: Continuously grab image from webcam stream and detect it.
    ********************************************************************/

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
        video: true
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

      console.log(angularComponent.currentSignaturePointsIndex);

      // if both index finger tip and thumb tip are close enough
      if (index_finger_tip && thumb_tip) {
        const distance = Math.sqrt(Math.pow(index_finger_tip.x - thumb_tip.x, 2) + Math.pow(index_finger_tip.y - thumb_tip.y, 2));
        if (distance < 0.05) {
          if (angularComponent.currentSignaturePointsIndex === -1) {
            angularComponent.currentSignaturePointsIndex = 0;
          }

          if (angularComponent.signaturePoints.at(angularComponent.currentSignaturePointsIndex) === undefined) {
            angularComponent.signaturePoints[angularComponent.currentSignaturePointsIndex] = new Array<{ x: number, y: number }>();
          }

          // draw point on canvas based on index finger tip and thumb tip touch position
          // since canvas rerenders every frame, this will create a line if we store points in an array

          // Add new point to canvas
          angularComponent.signaturePoints.at(angularComponent.currentSignaturePointsIndex)?.push({ x: index_finger_tip.x, y: index_finger_tip.y });
          console.log(angularComponent.signaturePoints);
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
      if (results?.landmarks) {
        for (const landmarks of results.landmarks) {
          drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
            color: "#00FF00",
            lineWidth: 5
          });
          drawingUtils.drawLandmarks(landmarks, { color: "#FF0000", lineWidth: 2 });
        }
      }
      canvasCtx.restore();
      angularComponent.signaturePoints.forEach((signaturePoints) => {
        signaturePoints.forEach((point, index) => {
          if (index === 0) {
            return;
          }

          if (index > 0) {
            const previousPoint = signaturePoints.at(index - 1);

            if (previousPoint === undefined) {
              return;
            }

            canvasCtx.lineWidth = 2;
            canvasCtx.beginPath();
            canvasCtx.moveTo(previousPoint.x * canvasElement.width, previousPoint.y * canvasElement.height);
            canvasCtx.lineTo(point.x * canvasElement.width, point.y * canvasElement.height);
            canvasCtx.stroke();
            canvasCtx.lineWidth = 1;
          }
        });
      });

      // Call this function again to keep predicting when the browser is ready.
      if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
      }
    }
  }
}
