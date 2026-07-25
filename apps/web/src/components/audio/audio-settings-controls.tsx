"use client";

import { Label, Slider } from "@heroui/react";
import musicIcon from "@iconify-icons/solar/music-note-2-bold-duotone";
import volumeIcon from "@iconify-icons/solar/volume-loud-outline";
import { Icon } from "@iconify/react";

import type { AudioSettings } from "@/lib/audio-settings";

import styles from "./audio-settings-controls.module.css";

const AUDIO_CHANNELS = [
  {
    description: "Home and waiting-room soundtrack.",
    icon: musicIcon,
    key: "lobbyMusicVolume",
    label: "Lobby Music",
  },
  {
    description: "Turns, building, resources, robber, trade, and victory cues.",
    icon: volumeIcon,
    key: "soundEffectsVolume",
    label: "Sound Effects",
  },
] as const;

export function AudioSettingsControls({
  onChange,
  settings,
}: {
  onChange(settings: AudioSettings): void;
  settings: AudioSettings;
}) {
  return (
    <section aria-labelledby="audio-settings-title" className={styles.group}>
      <h3 className={styles.title} id="audio-settings-title">
        Audio
      </h3>
      {AUDIO_CHANNELS.map((channel) => (
        <div className={styles.channel} key={channel.key}>
          <Slider
            className={styles.slider}
            formatOptions={{ style: "unit", unit: "percent" }}
            maxValue={100}
            minValue={0}
            onChange={(value) => {
              const nextVolume = Array.isArray(value) ? value[0] : value;
              onChange({ ...settings, [channel.key]: nextVolume });
            }}
            step={1}
            value={settings[channel.key]}
          >
            <Label className={styles.label}>
              <Icon aria-hidden="true" icon={channel.icon} /> {channel.label}
            </Label>
            <Slider.Output className={styles.output} />
            <Slider.Track className={styles.track}>
              <Slider.Fill className={styles.fill} />
              <Slider.Thumb className={styles.thumb} />
            </Slider.Track>
          </Slider>
          <p className={styles.help}>{channel.description}</p>
        </div>
      ))}
    </section>
  );
}
