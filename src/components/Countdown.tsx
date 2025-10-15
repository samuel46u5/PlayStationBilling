import useCountdown from "../hooks/useCountdown";

const Countdown = ({
  sessionId,
  startTimeMs,
  endTimeMs,
  isPrepaid,
  onComplete,
}: {
  sessionId: string;
  startTimeMs: number;
  endTimeMs: number | null;
  isPrepaid: boolean;
  onComplete: () => void;
}) => {
  const time = useCountdown(
    sessionId,
    startTimeMs,
    endTimeMs,
    isPrepaid,
    onComplete
  );

  // Format countdown in HH:MM:SS for Live Timer Display
  const formatCountdownHMS = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    // Pad with zero
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `Sisa Waktu : ${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  };

  // Format elapsed time in HH:MM:SS for PAY AS YOU GO
  const formatElapsedHMS = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `Durasi : ${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  };

  return (
    <span>{isPrepaid ? formatCountdownHMS(time) : formatElapsedHMS(time)}</span>
  );
};

export default Countdown;
