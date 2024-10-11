// TalkingHead.js
import React, { useState, useEffect, useRef } from 'react';

const alphaForMovingAverage = 0.3;

function TalkingHead({ name, audioSrc, isPlaying }) {
  const audioRef = useRef(null);
  const canvasRef = useRef(null);

  const [isTalking, setIsTalking] = useState(false);
  const [context, setContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const sourceNode = useRef(null);

  const animationFrameId = useRef(null);
  const curVoiceActivityLevel = useRef(0);

  /** Initialize Audio and AudioContext when audioSrc changes */
  useEffect(() => {
    // Clean up previous audio element and context
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (sourceNode.current) {
      sourceNode.current.disconnect();
      sourceNode.current = null;
    }
    if (analyser) {
      analyser.disconnect();
      setAnalyser(null);
    }
    if (context) {
      if (context.state !== 'closed') {
        context.close();
      }
      setContext(null);
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }

    // Create new audio element
    const audioElement = new Audio();
    audioElement.src = audioSrc;
    audioElement.crossOrigin = 'anonymous';
    audioRef.current = audioElement;

    // Create new AudioContext
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    setContext(audioContext);

    // Create source node and analyser
    try {
      sourceNode.current = audioContext.createMediaElementSource(audioElement);
    } catch (error) {
      console.error('Error creating MediaElementSource:', error);
    }
    const analyserNode = audioContext.createAnalyser();
    setAnalyser(analyserNode);

    // Configure analyser
    analyserNode.fftSize = 1024;
    analyserNode.minDecibels = -80;
    analyserNode.maxDecibels = -10;
    analyserNode.smoothingTimeConstant = 0.4;

    // Connect nodes
    sourceNode.current.connect(analyserNode);
    analyserNode.connect(audioContext.destination);

    // Error handling
    audioElement.addEventListener('error', (e) => {
      console.error(`Error loading audio for ${name}:`, e);
    });

    // Cleanup on unmount or when audioSrc changes
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      if (sourceNode.current) {
        sourceNode.current.disconnect();
        sourceNode.current = null;
      }
      if (analyserNode) {
        analyserNode.disconnect();
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioSrc, name]);

  /** Handle play/pause and start visualization */
  useEffect(() => {
    if (audioRef.current && context && analyser) {
      if (isPlaying) {
        if (context.state === 'suspended') {
          context.resume();
        }
        audioRef.current.play().catch((error) => {
          console.error(`Error playing audio for ${name}:`, error);
        });

        // Start visualization
        const renderFrame = () => {
          if (!analyser || !isPlaying) return;

          const data = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(data);

          const total = data.reduce((sum, value) => sum + value, 0);
          const voiceActivityLevel = Math.floor(total / 1000);

          // Apply moving average
          curVoiceActivityLevel.current = Math.max(
            0,
            Math.floor(
              alphaForMovingAverage * curVoiceActivityLevel.current +
                (1 - alphaForMovingAverage) * voiceActivityLevel
            )
          );
          setIsTalking(voiceActivityLevel > 0);

          // Draw visualization
          const canvas = canvasRef.current;
          if (canvas) {
            const width = canvas.offsetWidth;
            const height = canvas.offsetHeight;
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'rgb(148 163 184)';
            ctx.clearRect(0, 0, width, height);

            const radius = width * (0.29 + 0.2 * Math.min(curVoiceActivityLevel.current / 20, 1));
            ctx.beginPath();
            ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
            ctx.fill();
          }

          // Schedule next frame
          animationFrameId.current = requestAnimationFrame(renderFrame);
        };

        // Start rendering frames
        animationFrameId.current = requestAnimationFrame(renderFrame);
      } else {
        audioRef.current.pause();
        if (context.state === 'running') {
          context.suspend();
        }
        setIsTalking(false);

        // Clear visualization
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
          animationFrameId.current = null;
        }
      }
    }

    // Cleanup when isPlaying changes
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [isPlaying, context, analyser, name]);

  return (
    <div>
      {/* No audio element in the DOM */}
      <div
        className={`w-64 h-64 ${
          isTalking ? '!border-slate-400' : 'opacity-90'
        } bg-slate-700 border-2 border-slate-600 flex place-content-center rounded-3xl m-4`}
      >
        <div className="relative flex w-2/3 h-2/3 place-self-center place-content-center">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0"></canvas>
          <div className="flex w-3/5 h-3/5 bg-gray-600 rounded-full place-self-center place-content-center z-10">
            <p className="place-self-center text-lg text-slate-300">{name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TalkingHead;
