import React, { useState, useRef, useEffect } from 'react';
import styles from './MusicPlayer.module.css';

const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log('Autoplay prevented', e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className={styles.musicButton} onClick={togglePlay} role="button" aria-label={isPlaying ? 'Pause' : 'Play'}>
      <audio
        ref={audioRef}
        loop
        src="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=ambient-piano-amp-strings-10711.mp3"
      />

      <span className={styles.iconStage}>
        <svg
          className={`${styles.icon} ${styles.iconNote} ${isPlaying ? styles.iconHidden : styles.iconVisible}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M9 18V5l12-2v13"></path>
          <circle cx="6" cy="18" r="3"></circle>
          <circle cx="18" cy="16" r="3"></circle>
        </svg>
        <span className={`${styles.waveformContainer} ${isPlaying ? styles.iconVisible : styles.iconHidden}`}>
          <span className={styles.waveBar}></span>
          <span className={styles.waveBar}></span>
          <span className={styles.waveBar}></span>
          <span className={styles.waveBar}></span>
          <span className={styles.waveBar}></span>
        </span>
      </span>
    </div>
  );
};

export default MusicPlayer;