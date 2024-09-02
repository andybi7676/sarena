import React, { useRef, useEffect, useState } from 'react';

function AudioPlayerWithCapture() {
  const audioRef = useRef(null);
  const [mediaStreamTrack, setMediaStreamTrack] = useState(null);

  useEffect(() => {
    const audioElement = audioRef.current;
    let audioContext;
    let mediaStreamDestination;

    if (audioElement) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Create a MediaElementAudioSourceNode from the HTMLAudioElement
      const source = audioContext.createMediaElementSource(audioElement);

      // Create a MediaStreamDestinationNode
      mediaStreamDestination = audioContext.createMediaStreamDestination();

      // Connect the source to the destination (and to the audio context's output)
      source.connect(mediaStreamDestination);
      source.connect(audioContext.destination);

      // Extract the MediaStreamTrack from the destination node
      const track = mediaStreamDestination.stream.getAudioTracks()[0];

      // Set the track to state
      setMediaStreamTrack(track);
    }

    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, []);

  useEffect(() => {
    if (mediaStreamTrack) {
      // Here you can use the MediaStreamTrack, e.g., to send it over WebRTC
      console.log('MediaStreamTrack is ready:', mediaStreamTrack);
    }
  }, [mediaStreamTrack]);

  return (
    <div>
      <h1>Audio Player with Capture</h1>
      <audio ref={audioRef} controls>
        <source src="sample.mp3" type="audio/mp3" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}

export default AudioPlayerWithCapture;
