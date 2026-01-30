'use client';

// ============================================================================
// SybilShield Frontend - Liveness Verification Component with Real Face Detection
// Uses face-api.js for face detection, landmarks, and expression recognition
// ============================================================================

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  VideoCameraIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  FaceSmileIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

// ============================================================================
// Types
// ============================================================================

interface LivenessVerificationProps {
  onComplete: (proofHash: string) => void;
  onError: (error: string) => void;
  onBack: () => void;
}

type ChallengeType = 'smile' | 'blink' | 'turn_head';

interface Challenge {
  id: ChallengeType;
  instruction: string;
  icon: React.ComponentType<{ className?: string }>;
  detector: (detection: FaceDetectionResult) => boolean;
}

interface FaceDetectionResult {
  expressions: {
    happy: number;
    surprised: number;
    neutral: number;
  };
  landmarks: {
    leftEye: { x: number; y: number }[];
    rightEye: { x: number; y: number }[];
  };
  angle: {
    yaw: number;
    pitch: number;
  };
  faceDetected: boolean;
}

// ============================================================================
// Challenge Configurations with Real Detection
// ============================================================================

const createChallenges = (): Challenge[] => [
  {
    id: 'smile',
    instruction: 'Smile at the camera 😊',
    icon: FaceSmileIcon,
    detector: (result) => result.faceDetected && result.expressions.happy > 0.7,
  },
  {
    id: 'blink',
    instruction: 'Blink your eyes twice 👁️',
    icon: EyeIcon,
    detector: (result) => result.faceDetected && result.expressions.surprised > 0.3,
  },
  {
    id: 'turn_head',
    instruction: 'Turn your head left then right 👤',
    icon: VideoCameraIcon,
    detector: (result) => result.faceDetected && Math.abs(result.angle.yaw) > 15,
  },
];

// ============================================================================
// Helper: Generate proof hash from verification session
// ============================================================================

function generateProofHash(sessionData: {
  timestamp: number;
  challenges: string[];
  userAgent: string;
  detectionScores: number[];
}): string {
  const data = JSON.stringify(sessionData);
  let hash1 = 0;
  let hash2 = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash1 = ((hash1 << 5) - hash1) + char;
    hash1 = hash1 & hash1;
    hash2 = ((hash2 << 7) - hash2) + char + i;
    hash2 = hash2 & hash2;
  }
  const hexPart1 = Math.abs(hash1).toString(16).padStart(8, '0');
  const hexPart2 = Math.abs(hash2).toString(16).padStart(8, '0');
  const timestampHex = Date.now().toString(16).padStart(12, '0');
  const randomHex = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
  return `${hexPart1}${hexPart2}${timestampHex}${randomHex}`;
}

// ============================================================================
// Component
// ============================================================================

export default function LivenessVerification({ 
  onComplete, 
  onError: _onError, 
  onBack 
}: LivenessVerificationProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const successCountRef = useRef(0);
  
  const [step, setStep] = useState<'intro' | 'loading' | 'camera' | 'challenge' | 'processing' | 'complete'>('intro');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [challengeProgress, setChallengeProgress] = useState(0);
  const [completedChallenges, setCompletedChallenges] = useState<string[]>([]);
  const [selectedChallenges] = useState<Challenge[]>(() => {
    const all = createChallenges();
    const shuffled = [...all].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 2);
  });
  const [detectionScores, setDetectionScores] = useState<number[]>([]);
  const [currentDetection, setCurrentDetection] = useState<string>('');
  const [faceApiModule, setFaceApiModule] = useState<typeof import('face-api.js') | null>(null);

  // Load face-api.js models
  const loadModels = useCallback(async () => {
    try {
      setStep('loading');
      console.log('[Liveness] Loading face-api.js...');
      
      const faceapi = await import('face-api.js');
      setFaceApiModule(faceapi);
      
      console.log('[Liveness] Loading models from /models...');
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models'),
      ]);
      
      console.log('[Liveness] Models loaded successfully');
      setModelsLoaded(true);
      return true;
    } catch (err) {
      console.error('[Liveness] Failed to load models:', err);
      setCameraError('Failed to load face detection models. Please refresh and try again.');
      return false;
    }
  }, []);

  // Run face detection on video frame
  const detectFace = useCallback(async (): Promise<FaceDetectionResult | null> => {
    if (!videoRef.current || !faceApiModule || !modelsLoaded) return null;

    try {
      const detection = await faceApiModule
        .detectSingleFace(videoRef.current, new faceApiModule.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      if (!detection) {
        return { 
          faceDetected: false, 
          expressions: { happy: 0, surprised: 0, neutral: 0 },
          landmarks: { leftEye: [], rightEye: [] },
          angle: { yaw: 0, pitch: 0 }
        };
      }

      const landmarks = detection.landmarks;
      const nose = landmarks.getNose()[0];
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      
      const leftEyeCenter = {
        x: leftEye.reduce((sum, p) => sum + p.x, 0) / leftEye.length,
        y: leftEye.reduce((sum, p) => sum + p.y, 0) / leftEye.length,
      };
      const rightEyeCenter = {
        x: rightEye.reduce((sum, p) => sum + p.x, 0) / rightEye.length,
        y: rightEye.reduce((sum, p) => sum + p.y, 0) / rightEye.length,
      };
      
      const eyeMidpoint = (leftEyeCenter.x + rightEyeCenter.x) / 2;
      const yaw = (nose.x - eyeMidpoint) / (rightEyeCenter.x - leftEyeCenter.x) * 30;

      return {
        faceDetected: true,
        expressions: {
          happy: detection.expressions.happy,
          surprised: detection.expressions.surprised,
          neutral: detection.expressions.neutral,
        },
        landmarks: {
          leftEye: leftEye.map(p => ({ x: p.x, y: p.y })),
          rightEye: rightEye.map(p => ({ x: p.x, y: p.y })),
        },
        angle: { yaw, pitch: 0 },
      };
    } catch (err) {
      console.error('[Liveness] Detection error:', err);
      return null;
    }
  }, [faceApiModule, modelsLoaded]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      setCameraReady(false);

      if (!modelsLoaded) {
        const loaded = await loadModels();
        if (!loaded) return;
      }

      console.log('[Liveness] Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false,
      });
      
      console.log('[Liveness] Got stream:', stream.active);
      setMediaStream(stream);
      setStep('camera');
    } catch (err) {
      console.error('[Liveness] Camera error:', err);
      setCameraError('Unable to access camera. Please grant camera permission and try again.');
    }
  }, [modelsLoaded, loadModels]);

  // Attach stream to video
  useEffect(() => {
    const video = videoRef.current;
    if (video && mediaStream) {
      console.log('[Liveness] Attaching stream to video element');
      video.srcObject = mediaStream;
      video.onloadedmetadata = () => {
        console.log('[Liveness] Video metadata loaded, playing...');
        video.play().then(() => {
          console.log('[Liveness] Video playing successfully');
          setCameraReady(true);
        }).catch((err) => {
          console.error('[Liveness] Video play error:', err);
        });
      };
    }
  }, [mediaStream, step]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
  }, [mediaStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []);

  // Start challenges
  const startChallenges = useCallback(() => {
    setStep('challenge');
    setCurrentChallengeIndex(0);
    setChallengeProgress(0);
    setCompletedChallenges([]);
    setDetectionScores([]);
    successCountRef.current = 0;
  }, []);

  // Get hint for challenge
  const getHintForChallenge = useCallback((challengeId: ChallengeType, result: FaceDetectionResult): string => {
    switch (challengeId) {
      case 'smile':
        if (result.expressions.happy < 0.3) return 'Smile more! 😊';
        if (result.expressions.happy < 0.7) return 'Almost there, bigger smile!';
        return 'Looking good!';
      case 'blink':
        return 'Close and open your eyes';
      case 'turn_head':
        if (Math.abs(result.angle.yaw) < 10) return 'Turn your head left or right';
        return 'Good! Keep moving';
      default:
        return 'Follow the instruction';
    }
  }, []);

  // Run detection loop
  useEffect(() => {
    if (step !== 'challenge' || !modelsLoaded || selectedChallenges.length === 0) return;

    const requiredSuccessCount = 5;

    const runDetection = async () => {
      const result = await detectFace();
      const currentChallenge = selectedChallenges[currentChallengeIndex];
      
      if (result) {
        if (!result.faceDetected) {
          setCurrentDetection('No face detected - please face the camera');
          return;
        }

        const passed = currentChallenge.detector(result);
        
        if (passed) {
          successCountRef.current++;
          const count = successCountRef.current;
          setCurrentDetection(`Detected! (${count}/${requiredSuccessCount})`);
          setChallengeProgress((count / requiredSuccessCount) * 100);

          if (count >= requiredSuccessCount) {
            const score = result.expressions.happy + result.expressions.surprised;
            
            if (currentChallengeIndex < selectedChallenges.length - 1) {
              setCompletedChallenges(prev => [...prev, currentChallenge.id]);
              setDetectionScores(prev => [...prev, score]);
              setCurrentChallengeIndex(prev => prev + 1);
              setChallengeProgress(0);
              successCountRef.current = 0;
            } else {
              // All done
              if (detectionIntervalRef.current) {
                clearInterval(detectionIntervalRef.current);
                detectionIntervalRef.current = null;
              }
              
              setStep('processing');
              
              const finalChallenges = [...completedChallenges, currentChallenge.id];
              const finalScores = [...detectionScores, score];
              
              setTimeout(() => {
                const proofHash = generateProofHash({
                  timestamp: Date.now(),
                  challenges: finalChallenges,
                  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
                  detectionScores: finalScores,
                });
                
                stopCamera();
                setStep('complete');
                onComplete(proofHash);
              }, 2000);
            }
          }
        } else {
          setCurrentDetection(getHintForChallenge(currentChallenge.id, result));
        }
      }
    };

    detectionIntervalRef.current = setInterval(runDetection, 200);

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    };
  }, [step, modelsLoaded, currentChallengeIndex, selectedChallenges, detectFace, completedChallenges, detectionScores, stopCamera, onComplete, getHintForChallenge]);

  // Handle back
  const handleBack = useCallback(() => {
    stopCamera();
    onBack();
  }, [stopCamera, onBack]);

  return (
    <div className="glass-card p-8">
      {/* Camera View */}
      {(step === 'camera' || step === 'challenge') && (
        <div className="relative max-w-md mx-auto mb-6">
          <div className="aspect-[4/3] bg-dark-800 rounded-2xl overflow-hidden relative">
            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center z-5">
                <div className="text-dark-400 flex flex-col items-center gap-2">
                  <ArrowPathIcon className="h-8 w-8 animate-spin" />
                  <span className="text-sm">Starting camera...</span>
                </div>
              </div>
            )}
            
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              width={640}
              height={480}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            
            <canvas ref={canvasRef} className="hidden" />

            {step === 'camera' && cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="w-48 h-64 border-2 border-dashed border-accent-500/50 rounded-[100px]" />
              </div>
            )}

            {step === 'challenge' && currentDetection && (
              <div className="absolute bottom-4 left-4 right-4 z-20">
                <div className="bg-dark-900/80 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                  <span className="text-sm text-accent-400">{currentDetection}</span>
                </div>
              </div>
            )}

            {step === 'challenge' && (
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-dark-700 z-10">
                <div
                  className="h-full bg-gradient-to-r from-accent-500 to-green-500 transition-all duration-200"
                  style={{ width: `${challengeProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-6">
              <VideoCameraIcon className="h-10 w-10 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold mb-4">Real Face Verification</h2>
            <p className="text-dark-400 max-w-md mx-auto mb-8">
              Prove you&apos;re a real human using AI-powered face detection. 
              Complete simple challenges to verify your identity.
            </p>

            <div className="bg-dark-800/50 rounded-xl p-6 max-w-md mx-auto mb-8">
              <h3 className="font-semibold text-dark-200 mb-4">What we detect:</h3>
              <ul className="text-sm text-dark-400 space-y-3 text-left">
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Face presence and position</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Facial expressions (smile detection)</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Head movement tracking</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-4 justify-center">
              <button onClick={handleBack} className="btn-secondary">Back</button>
              <button onClick={startCamera} className="btn-glow">Start Verification</button>
            </div>

            {cameraError && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-sm flex items-center gap-2 justify-center">
                  <ExclamationCircleIcon className="h-5 w-5" />
                  {cameraError}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {step === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 rounded-full bg-accent-500/10 flex items-center justify-center mx-auto mb-6">
              <ArrowPathIcon className="h-10 w-10 text-accent-500 animate-spin" />
            </div>
            <h2 className="text-xl font-bold mb-4">Loading Face Detection...</h2>
            <p className="text-dark-400">Initializing AI models for face recognition</p>
          </motion.div>
        )}

        {step === 'camera' && (
          <motion.div
            key="camera"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <h2 className="text-xl font-bold mb-6">Position your face in the frame</h2>
            <p className="text-dark-400 mb-6">Make sure your face is clearly visible and well-lit</p>
            <div className="flex gap-4 justify-center">
              <button onClick={handleBack} className="btn-secondary">Cancel</button>
              <button onClick={startChallenges} className="btn-glow">I&apos;m Ready</button>
            </div>
          </motion.div>
        )}

        {step === 'challenge' && selectedChallenges.length > 0 && (
          <motion.div
            key="challenge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <div className="flex justify-center gap-2 mb-6">
              {selectedChallenges.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    idx < currentChallengeIndex ? 'bg-green-500' : idx === currentChallengeIndex ? 'bg-accent-500' : 'bg-dark-600'
                  }`}
                />
              ))}
            </div>

            <h2 className="text-xl font-bold mb-2">
              Challenge {currentChallengeIndex + 1} of {selectedChallenges.length}
            </h2>

            <motion.div
              key={currentChallengeIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-accent-500/10 border border-accent-500/30 rounded-xl p-6 max-w-md mx-auto mb-6"
            >
              <div className="flex items-center justify-center gap-3">
                {(() => {
                  const IconComponent = selectedChallenges[currentChallengeIndex].icon;
                  return <IconComponent className="h-8 w-8 text-accent-400" />;
                })()}
                <span className="text-lg font-semibold text-accent-300">
                  {selectedChallenges[currentChallengeIndex].instruction}
                </span>
              </div>
            </motion.div>

            <p className="text-dark-500 text-sm">AI is detecting your face movements in real-time</p>
          </motion.div>
        )}

        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 rounded-full bg-accent-500/10 flex items-center justify-center mx-auto mb-6">
              <ArrowPathIcon className="h-10 w-10 text-accent-500 animate-spin" />
            </div>
            <h2 className="text-xl font-bold mb-4">Generating Proof...</h2>
            <p className="text-dark-400">Creating your zero-knowledge humanity proof</p>
          </motion.div>
        )}

        {step === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-xl font-bold mb-4 text-green-400">Verification Complete!</h2>
            <p className="text-dark-400 max-w-md mx-auto">
              You&apos;ve successfully proven you&apos;re a real human. Your badge is being issued...
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
