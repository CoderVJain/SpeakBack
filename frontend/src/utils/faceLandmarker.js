import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

let _promise = null

export async function getFaceLandmarker() {
  if (!_promise) _promise = _init()
  return _promise
}

async function _init() {
  const vision = await FilesetResolver.forVisionTasks('/wasm')
  return FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
      delegate: 'GPU',
    },
    outputFaceBlendshapes: true,
    runningMode: 'VIDEO',
    numFaces: 1,
  })
}
