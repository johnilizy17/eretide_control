import { useEffect, useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { ScanFace, Camera, Loader2, CheckCircle2, XCircle, AlertCircle, ShieldCheck, RefreshCw } from 'lucide-react';

interface FaceVerificationModalProps {
  photo: string;
  profileName: string;
  onVerified: () => void;
  onContinue: () => void;
}

const MATCH_THRESHOLD = 0.5;

const MODEL_PATH = '/models';

const loadModels = async () => {
  const nets = faceapi.nets as any;
  const tasks: Promise<unknown>[] = [];
  if (!nets.tinyFaceDetector.isLoaded) {
    tasks.push(faceapi.loadTinyFaceDetectorModel(MODEL_PATH));
  }
  if (!nets.faceLandmark68Net.isLoaded) {
    tasks.push(faceapi.loadFaceLandmarkModel(MODEL_PATH));
  }
  if (!nets.faceRecognitionNet.isLoaded) {
    tasks.push(faceapi.loadFaceRecognitionModel(MODEL_PATH));
  }
  await Promise.all(tasks);
};

const toImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image could not be loaded'));
    img.src = url;
  });

const loadReferenceImage = async (src: string): Promise<HTMLImageElement> => {
  if (src.startsWith('data:')) return toImage(src);
  try {
    const blob = await fetch(src).then((res) => {
      if (!res.ok) throw new Error('Network response was not ok');
      return res.blob();
    });
    const objectUrl = URL.createObjectURL(blob);
    try {
      return await toImage(objectUrl);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    return toImage(src);
  }
};

export const FaceVerificationModal = ({
  photo,
  profileName,
  onVerified,
  onContinue,
}: FaceVerificationModalProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsError, setModelsError] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [videoReady, setVideoReady] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<{ passed: boolean; distance: number } | null>(null);
  const [message, setMessage] = useState('');
  const [referenceFailed, setReferenceFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const startModels = async () => {
      try {
        await loadModels();
      } catch (err: any) {
        console.error('Face models failed to load:', err);
        if (!cancelled) {
          setModelsError(
            'Face recognition models could not be loaded. Please check your connection and try again.'
          );
        }
      } finally {
        if (!cancelled) setModelsLoading(false);
      }
    };

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          if (!cancelled) {
            setCameraError(
              'Camera is not available in this browser. Use a supported browser with camera access enabled.'
            );
          }
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const video = videoRef.current;
        if (!video) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        await video.play();
        if (!cancelled) setVideoReady(true);
      } catch (err: any) {
        if (!cancelled) {
          setCameraError(
            err?.name === 'NotAllowedError'
              ? 'Camera access was denied. Please allow camera access to verify your identity.'
              : 'Unable to start the camera. Ensure a camera is connected, then try again.'
          );
        }
      }
    };

    startModels();
    startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  const verify = async () => {
    const video = videoRef.current;
    if (!video || !videoReady || modelsLoading) return;

    setVerifying(true);
    setResult(null);
    setMessage('');

    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 416 });

    let liveDetection: any;
    try {
      liveDetection = await faceapi
        .detectSingleFace(videoRef.current as HTMLVideoElement, options)
        .withFaceLandmarks()
        .withFaceDescriptor();
    } catch (err: any) {
      console.error('Live frame detection failed:', err);
      setMessage('Could not read the camera frame. Please try again.');
      setVerifying(false);
      return;
    }

    if (!liveDetection) {
      setMessage('No face detected in the camera feed. Make sure your face is clearly visible.');
      setVerifying(false);
      return;
    }

    let referenceDetection: any;
    try {
      const reference = await loadReferenceImage(photo);
      referenceDetection = await faceapi
        .detectSingleFace(reference, options)
        .withFaceLandmarks()
        .withFaceDescriptor();
    } catch (err: any) {
      console.error('Reference photo detection failed:', err);
      setReferenceFailed(true);
      setVerifying(false);
      return;
    }

    if (!referenceDetection) {
      setReferenceFailed(true);
      setVerifying(false);
      return;
    }

    try {
      const distance = faceapi.euclideanDistance(
        liveDetection.descriptor,
        referenceDetection.descriptor
      );
      const passed = distance <= MATCH_THRESHOLD;

      setResult({ passed, distance });

      if (passed) {
        setTimeout(onVerified, 900);
      } else {
        setMessage('Face does not match the profile on record. Please try again.');
      }
    } catch (err: any) {
      console.error('Face comparison failed:', err);
      setMessage('Face verification could not be completed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const busy = verifying || modelsLoading || !videoReady;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500 rounded-2xl mb-3">
            <ScanFace className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Face Verification</h2>
          <p className="text-slate-300 text-sm mt-1">
            Look at the camera so we can confirm it's really you, {profileName}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6">
          {/* Camera + Reference */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="col-span-2 relative rounded-xl overflow-hidden bg-slate-900 aspect-[4/3]">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                onPlaying={() => setVideoReady(true)}
                onLoadedData={() => setVideoReady(true)}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 left-2 text-[10px] font-semibold text-white bg-black/50 rounded px-2 py-0.5">
                LIVE
              </span>
              {!cameraError && !videoReady && (
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/90 bg-black/40 text-xs font-medium">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Starting camera…
                </span>
              )}
              {cameraError && (
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/90 bg-black/40 text-xs font-medium">
                  <AlertCircle className="w-5 h-5" />
                  Camera unavailable
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <div className="relative flex-1 rounded-xl overflow-hidden bg-slate-200">
                <img src={photo} alt="Profile" className="w-full h-full object-cover" />
                <span className="absolute inset-x-0 bottom-0 text-center text-[9px] font-semibold text-white bg-black/50 py-0.5">
                  PROFILE
                </span>
              </div>
              <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Biometric check
              </div>
            </div>
          </div>

          {/* Models availability notice */}
          {modelsLoading && !cameraError && (
            <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              Downloading face recognition models… (first time only)
            </div>
          )}
          {modelsError && !cameraError && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              {modelsError}
            </div>
          )}

          {/* Camera error notice */}
          {cameraError && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              {cameraError}
            </div>
          )}

          {/* Result / feedback */}
          {result && (
            <div
              className={`mb-4 p-3 rounded-xl border flex items-center gap-2 text-sm ${
                result.passed
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              {result.passed ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span>
                {result.passed
                  ? 'Identity verified — matches your profile. Redirecting…'
                  : `Face does not match your profile (similarity ${Math.max(
                      0,
                      1 - result.distance
                    ).toFixed(2)}).`}
              </span>
            </div>
          )}

          {message && !result && !referenceFailed && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              {message}
            </div>
          )}

          {referenceFailed && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              We could not read the profile photo on record (it may not allow cross-origin access).
              You can continue without face verification.
            </div>
          )}

          {/* Actions */}
          {!cameraError && !modelsError && !referenceFailed && (
            <button
              type="button"
              onClick={verify}
              disabled={busy}
              className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {verifying || modelsLoading || !videoReady ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : result && !result.passed ? (
                <RefreshCw className="w-5 h-5" />
              ) : (
                <Camera className="w-5 h-5" />
              )}
              {verifying
                ? 'Verifying face…'
                : modelsLoading
                  ? 'Loading models…'
                  : !videoReady
                    ? 'Starting camera…'
                    : result && !result.passed
                      ? 'Try Again'
                      : 'Capture & Verify'}
            </button>
          )}

          {(cameraError || modelsError || referenceFailed) && (
            <button
              type="button"
              onClick={onContinue}
              className="w-full py-3 mt-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Continue anyway
            </button>
          )}
        </div>
      </div>
    </div>
  );
};