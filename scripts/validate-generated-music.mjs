import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const manifestPath = path.join(repositoryRoot, "docs/audio/music-generation-manifest.json");
const metadataPath = path.join(
  repositoryRoot,
  "apps/web/public/audio/music/generation-metadata.json",
);
const reportPath = path.join(repositoryRoot, "docs/audio/generated-music-report.md");

function formatDuration(seconds) {
  const roundedSeconds = Math.round(seconds);
  const minutes = Math.floor(roundedSeconds / 60);
  return `${minutes}:${String(roundedSeconds % 60).padStart(2, "0")}`;
}

async function inspectAudio(filePath) {
  const { stdout } = await run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=format_name,duration,size,bit_rate",
    "-show_entries",
    "stream=codec_name,sample_rate,channels",
    "-of",
    "json",
    filePath,
  ]);
  const probe = JSON.parse(stdout);
  const stream = probe.streams?.[0];
  const format = probe.format;
  const contents = await readFile(filePath);

  return {
    codec: stream?.codec_name,
    sampleRate: Number(stream?.sample_rate),
    channels: Number(stream?.channels),
    format: format?.format_name,
    durationSeconds: Number(format?.duration),
    sizeBytes: Number(format?.size),
    bitrate: Number(format?.bit_rate),
    sha256: createHash("sha256").update(contents).digest("hex"),
  };
}

async function main() {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const metadata = JSON.parse(await readFile(metadataPath, "utf8"));
  const metadataById = new Map(metadata.map((entry) => [entry.id, entry]));
  const issues = [];
  const inspectedEntries = [];

  for (const track of manifest.tracks) {
    const entry = metadataById.get(track.id);
    if (!entry) {
      issues.push(`${track.id}: missing generation metadata`);
      continue;
    }

    const filePath = path.join(repositoryRoot, entry.file);
    const audio = await inspectAudio(filePath);
    if (audio.codec !== "mp3") issues.push(`${track.id}: codec is ${audio.codec}`);
    if (audio.sampleRate !== manifest.generation.sampleRate) {
      issues.push(`${track.id}: sample rate is ${audio.sampleRate}`);
    }
    if (audio.channels !== 2) issues.push(`${track.id}: expected stereo audio`);
    if (audio.bitrate < 250_000 || audio.bitrate > 260_000) {
      issues.push(`${track.id}: bitrate is ${audio.bitrate}`);
    }
    if (!Number.isFinite(audio.durationSeconds) || audio.durationSeconds <= 0) {
      issues.push(`${track.id}: invalid duration`);
    }

    inspectedEntries.push({
      ...entry,
      actualDurationSeconds: Number(audio.durationSeconds.toFixed(3)),
      durationDeltaSeconds: Number(
        (audio.durationSeconds - track.targetDurationSeconds).toFixed(3),
      ),
      codec: audio.codec,
      sampleRate: audio.sampleRate,
      channels: audio.channels,
      bitrate: audio.bitrate,
      sizeBytes: audio.sizeBytes,
      sha256: audio.sha256,
    });
  }

  const uniqueHashes = new Set(inspectedEntries.map((entry) => entry.sha256));
  if (uniqueHashes.size !== inspectedEntries.length) {
    issues.push("One or more generated variants contain identical audio bytes");
  }

  const variantsByCue = Map.groupBy(inspectedEntries, (entry) => entry.cue);
  for (const [cue, entries] of variantsByCue) {
    const variants = entries
      .map((entry) => entry.variant)
      .sort()
      .join(",");
    if (entries.length !== 2 || variants !== "A,B") {
      issues.push(`${cue}: expected variants A and B, received ${variants}`);
    }
  }

  const sortedEntries = inspectedEntries.sort((a, b) => a.id.localeCompare(b.id));
  await writeFile(metadataPath, `${JSON.stringify(sortedEntries, null, 2)}\n`);

  const rows = sortedEntries.map(
    (entry) =>
      `| ${entry.cue} | ${entry.variant} | ${entry.usage} | ${formatDuration(entry.targetDurationSeconds)} | ${formatDuration(entry.actualDurationSeconds)} | ${entry.sampleRate / 1000} kHz | ${Math.round(entry.bitrate / 1000)} kbps |`,
  );
  const totalDuration = sortedEntries.reduce(
    (total, entry) => total + entry.actualDurationSeconds,
    0,
  );
  const report = `# Generated Catansaga music report

## Result

${issues.length === 0 ? "**PASS**" : "**FAIL**"} — ${sortedEntries.length}/${manifest.tracks.length} tracks inspected, ${variantsByCue.size} cues with two variants each, ${uniqueHashes.size} unique audio files.

- Provider: ${manifest.provider}
- Model: \`${manifest.model}\`
- Mode: instrumental only; lyrics empty; lyrics optimization disabled
- Output: stereo MP3, 44.1 kHz, 256 kbps
- Combined generated duration: ${formatDuration(totalDuration)}

## Durations

Fal MiniMax Music 2.6 does not expose an exact duration input. Target durations were included in the prompts, while actual durations below come from \`ffprobe\` inspection of the downloaded files.

| Cue | Variant | Usage | Target | Actual | Sample rate | Bitrate |
| --- | --- | --- | ---: | ---: | ---: | ---: |
${rows.join("\n")}

## Validation issues

${issues.length === 0 ? "None." : issues.map((issue) => `- ${issue}`).join("\n")}
`;

  await writeFile(reportPath, report);
  console.log(report);
  if (issues.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
