const TARGET_RATE = 16000;
const FRAME_SAMPLES = 1600;

class PcmCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(FRAME_SAMPLES);
    this.filled = 0;
    this.cursor = 0;
    this.ratio = sampleRate / TARGET_RATE;
  }

  flush() {
    const frame = new Int16Array(FRAME_SAMPLES);
    for (let i = 0; i < FRAME_SAMPLES; i += 1) {
      const clamped = Math.max(-1, Math.min(1, this.buffer[i]));
      frame[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    }
    this.port.postMessage(frame.buffer, [frame.buffer]);
    this.filled = 0;
  }

  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (!channel) return true;

    while (this.cursor < channel.length) {
      const index = Math.floor(this.cursor);
      const next = Math.min(index + 1, channel.length - 1);
      const weight = this.cursor - index;
      this.buffer[this.filled] =
        channel[index] * (1 - weight) + channel[next] * weight;
      this.filled += 1;
      if (this.filled === FRAME_SAMPLES) this.flush();
      this.cursor += this.ratio;
    }
    this.cursor -= channel.length;

    return true;
  }
}

registerProcessor("pcm-capture", PcmCaptureProcessor);
