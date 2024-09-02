import React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';

const alphaForMovingAverage = 0.3;

function TalkingHead({ name, audioSrc, isPlaying }) {
  const audioRef = useRef(null);
  const [isTalking, setIsTalking] = useState(false);
  const canvasRef = useRef(null);

  const sourceNode = useRef(null);
  const [context, setContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const animationFrameId = useRef(null); // Store the animation frame ID
  const curVoiceActivityLevel = useRef(0);

  const report = useCallback(() => {
    if (!analyser || !isPlaying) return; // Stop if not playing
    // console.log(`report for ${name}`);
    
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    
    const _voiceActivity = data.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    const _voiceActivityLevel = Math.floor(_voiceActivity / 1000);
    // console.log(`Frequency Data from ${name}:`, data, _voiceActivity, _voiceActivityLevel);
    // moving average
    curVoiceActivityLevel.current = Math.max(0, Math.floor(
      alphaForMovingAverage * curVoiceActivityLevel.current 
      + 
      (1 - alphaForMovingAverage) * _voiceActivityLevel
    ));
    setIsTalking(_voiceActivityLevel > 0);
    const canvas = canvasRef.current;
    if (canvas !== null) {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "rgb(148 163 184)";
      // console.log(`draw from ${name}: ${curVoiceActivityLevel.current}`);
      
      // Clear the canvas before drawing
      ctx.clearRect(0, 0, width, height);
      // Draw a circle at the center of the canvas
      const radius = width * (0.29 + 0.2*(Math.min(curVoiceActivityLevel.current / 20, 1)));
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2, true); // Outer circle
      ctx.fill();
    }

    // Schedule the next report only if still playing
    if (isPlaying) {
      animationFrameId.current = requestAnimationFrame(report);
    }
  }, [analyser, isPlaying, name]);

  const initializeAudioContext = useCallback(() => {
    if (!context) {
      console.log('initializeAudioContext');

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      setContext(audioContext);

      const audioElement = audioRef.current;
      if (audioElement) {
        sourceNode.current = audioContext.createMediaElementSource(audioElement);

        const analyserNode = audioContext.createAnalyser();
        setAnalyser(analyserNode);

        analyserNode.fftSize = 1024;
        analyserNode.minDecibels = -80;
        analyserNode.maxDecibels = -10;
        analyserNode.smoothingTimeConstant = 0.4;

        // Connect source -> analyser -> destination (so we can hear the sound)
        sourceNode.current.connect(analyserNode);
        analyserNode.connect(audioContext.destination);
      }
    }
  }, [context]);

  useEffect(() => {
    if (audioRef.current !== null) {
      if (isPlaying) {
        if (context && context.state === 'suspended') {
          context.resume();
        }
        audioRef.current.play();
        initializeAudioContext();
      } else {
        audioRef.current.pause();
        curVoiceActivityLevel.current = 0;
        const canvas = canvasRef.current;
        if (canvas !== null) {
          const width = canvas.offsetWidth;
          const height = canvas.offsetHeight;
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "rgb(148 163 184)";
          
          // Clear the canvas before drawing
          ctx.clearRect(0, 0, width, height);
          // Draw a circle at the center of the canvas
        }
        setIsTalking(false);
      }
    }
    if (analyser && isPlaying) {
      animationFrameId.current = requestAnimationFrame(report);
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current); // Cancel the animation frame on cleanup
      }
    };
  }, [analyser, isPlaying, report, context]);

  return (
    <div>
      <audio ref={audioRef}>
        <source src={audioSrc} type="audio/flac" />
        Your browser does not support the audio element.
      </audio>
      <div
        className={`w-64 h-64 ${isTalking ? '!border-slate-400' : 'opacity-90'} bg-slate-700 border-2 border-slate-600 flex place-content-center rounded-3xl m-4`}
        onClick={() => setIsTalking(!isTalking)}
      >
        {/* <div className={`flex w-${24 + Math.ceil(voiceActivityLevel * 4)} h-${24 + Math.ceil(voiceActivityLevel * 4) rounded-full bg-slate-400 place-self-center place-content-center`}> */}
        <div className="relative flex w-2/3 h-2/3 place-self-center place-content-center">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0"></canvas>
          {/* <div class="absolute left-4 top-4 text-white">
            Overlay Text or Element
          </div> */}
          <div className="flex w-3/5 h-3/5 bg-gray-600 rounded-full place-self-center place-content-center z-10">
            <p className="place-self-center text-lg text-slate-300">{name}</p>
          </div>
        </div>
        {/* <canvas className={`flex !z-10 w-32 h-32 rounded-full bg-slate-400 place-self-center place-content-center`} /> */}
      </div>
    </div>
  );
}

export default TalkingHead;
