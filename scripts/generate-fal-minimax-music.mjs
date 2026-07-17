import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const envPath = path.join(repositoryRoot, "apps/web/.env");
const manifestPath = path.join(repositoryRoot, "docs/audio/music-generation-manifest.json");
const outputDirectory = path.join(repositoryRoot, "apps/web/public/audio/music");
const metadataPath = path.join(outputDirectory, "generation-metadata.json");
const pollIntervalMs = 5_000;

function readEnvValue(source, key) {
  const line = source
    .split(/\r?\n/u)
    .find((candidate) => candidate.trimStart().startsWith(`${key}=`));

  if (!line) {
    return undefined;
  }

  const value = line.slice(line.indexOf("=") + 1).trim();
  return value.replace(/^(['"])(.*)\1$/u, "$2");
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function readJsonResponse(response, context) {
  const body = await response.text();
  let result;

  try {
    result = JSON.parse(body);
  } catch {
    throw new Error(`${context} returned invalid JSON (HTTP ${response.status})`);
  }

  if (!response.ok) {
    const detail = result?.detail ?? result?.message ?? body;
    const message = typeof detail === "string" ? detail : JSON.stringify(detail);
    throw new Error(`${context} failed (HTTP ${response.status}): ${message}`);
  }

  return result;
}

async function submitTrack(apiKey, manifest, track) {
  const endpoint = `https://queue.fal.run/${manifest.model}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: track.prompt,
      lyrics: "",
      lyrics_optimizer: manifest.generation.lyricsOptimizer,
      is_instrumental: manifest.generation.isInstrumental,
      audio_setting: {
        sample_rate: manifest.generation.sampleRate,
        bitrate: manifest.generation.bitrate,
        format: manifest.generation.format,
      },
    }),
  });

  return readJsonResponse(response, `Fal submission for ${track.id}`);
}

async function waitForResult(apiKey, track, submission) {
  while (true) {
    const response = await fetch(submission.status_url, {
      headers: { Authorization: `Key ${apiKey}` },
    });
    const status = await readJsonResponse(response, `Fal status for ${track.id}`);

    if (status.status === "COMPLETED") {
      const resultResponse = await fetch(submission.response_url, {
        headers: { Authorization: `Key ${apiKey}` },
      });
      return readJsonResponse(resultResponse, `Fal result for ${track.id}`);
    }

    if (status.status !== "IN_QUEUE" && status.status !== "IN_PROGRESS") {
      throw new Error(`Fal generation failed for ${track.id}: ${JSON.stringify(status)}`);
    }

    const position = status.queue_position === undefined ? "" : `, queue ${status.queue_position}`;
    console.log(`  ${track.id}: ${status.status}${position}`);
    await wait(pollIntervalMs);
  }
}

async function downloadAudio(audioUrl, outputPath) {
  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error(`Audio download failed with HTTP ${response.status}`);
  }
  await writeFile(outputPath, Buffer.from(await response.arrayBuffer()));
}

async function loadMetadata() {
  if (!(await fileExists(metadataPath))) {
    return [];
  }
  return JSON.parse(await readFile(metadataPath, "utf8"));
}

async function main() {
  const envSource = await readFile(envPath, "utf8");
  const apiKey = process.env.FAL_KEY ?? readEnvValue(envSource, "FAL_KEY");
  if (!apiKey) {
    throw new Error(`FAL_KEY was not found in the environment or ${envPath}`);
  }

  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const requestedIds = new Set(
    process.argv
      .filter((argument) => argument.startsWith("--only="))
      .flatMap((argument) => argument.slice("--only=".length).split(","))
      .filter(Boolean),
  );
  const force = process.argv.includes("--force");
  const concurrencyArgument = process.argv.find((argument) =>
    argument.startsWith("--concurrency="),
  );
  const requestedConcurrency = Number(concurrencyArgument?.slice("--concurrency=".length) ?? 1);
  const concurrency = Number.isInteger(requestedConcurrency)
    ? Math.max(1, Math.min(requestedConcurrency, 4))
    : 1;
  const tracks = manifest.tracks.filter(
    (track) => requestedIds.size === 0 || requestedIds.has(track.id),
  );

  await mkdir(outputDirectory, { recursive: true });
  let metadata = await loadMetadata();
  let metadataWrite = Promise.resolve();
  const pendingTracks = [];

  for (const [index, track] of tracks.entries()) {
    const outputPath = path.join(outputDirectory, `${track.id}.mp3`);
    if (!force && (await fileExists(outputPath))) {
      console.log(`[${index + 1}/${tracks.length}] Skipping existing ${track.id}`);
      continue;
    }
    pendingTracks.push({ index, outputPath, track });
  }

  const saveMetadata = (entry) => {
    metadataWrite = metadataWrite.then(async () => {
      metadata = [...metadata.filter((candidate) => candidate.id !== entry.id), entry].sort(
        (a, b) => a.id.localeCompare(b.id),
      );
      await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
    });
    return metadataWrite;
  };

  const generateTrack = async ({ index, outputPath, track }) => {
    console.log(`[${index + 1}/${tracks.length}] Submitting ${track.id}`);
    const submission = await submitTrack(apiKey, manifest, track);
    console.log(`  request ${submission.request_id}`);
    const result = await waitForResult(apiKey, track, submission);
    const audio = result?.audio;
    if (!audio?.url) {
      throw new Error(`Fal result for ${track.id} did not include an audio URL`);
    }

    await downloadAudio(audio.url, outputPath);
    const entry = {
      id: track.id,
      cue: track.cue,
      variant: track.variant,
      usage: track.usage,
      provider: manifest.provider,
      model: manifest.model,
      instrumental: manifest.generation.isInstrumental,
      targetDurationSeconds: track.targetDurationSeconds,
      requestId: submission.request_id,
      contentType: audio.content_type ?? null,
      providerSizeBytes: audio.file_size ?? null,
      generatedAt: new Date().toISOString(),
      file: path.relative(repositoryRoot, outputPath),
    };

    await saveMetadata(entry);
    console.log(`Saved ${path.relative(repositoryRoot, outputPath)}`);
  };

  let nextTrackIndex = 0;
  const worker = async () => {
    while (nextTrackIndex < pendingTracks.length) {
      const pendingTrack = pendingTracks[nextTrackIndex];
      nextTrackIndex += 1;
      await generateTrack(pendingTrack);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, pendingTracks.length) }, () => worker()),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
