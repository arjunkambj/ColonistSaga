"use client";

import { Card, Chip, Modal } from "@heroui/react";
import musicIcon from "@iconify-icons/solar/music-note-2-bold-duotone";
import sparkleIcon from "@iconify-icons/solar/stars-bold-duotone";
import { Icon } from "@iconify/react";

import { AudioPlayButton } from "./audio-play-button";
import styles from "./asset-sheet.module.css";

export type AssetKind = "audio" | "brand" | "image";

export interface AssetCardItem {
  description?: string;
  fit?: "contain" | "cover";
  format?: string;
  kind?: AssetKind;
  name: string;
  path?: string;
  previewText?: string;
  status: "generated" | "needed";
  swatches?: readonly string[];
}

export function AssetCard({ asset }: { asset: AssetCardItem }) {
  const isGenerated = asset.status === "generated";
  const canPreview = Boolean(asset.path && asset.kind !== "audio");

  return (
    <Card className={styles.assetCard} data-status={asset.status} variant="transparent">
      <Card.Content className={styles.cardContent}>
        <div className={styles.preview} data-fit={asset.fit ?? "contain"}>
          {asset.kind === "brand" ? (
            <div className={styles.brandPreview}>
              {asset.swatches ? (
                <div aria-hidden="true" className={styles.swatchRow}>
                  {asset.swatches.map((swatch) => (
                    <span className={styles.swatch} key={swatch} style={{ background: swatch }} />
                  ))}
                </div>
              ) : null}
              {asset.previewText ? <span>{asset.previewText}</span> : null}
            </div>
          ) : canPreview ? (
            <Modal>
              <Modal.Trigger
                aria-label={`Open ${asset.name} preview`}
                className={styles.previewButton}
              >
                <img
                  alt={`${asset.name} asset preview`}
                  decoding="async"
                  draggable={false}
                  loading="lazy"
                  src={asset.path}
                />
              </Modal.Trigger>
              <Modal.Backdrop variant="blur">
                <Modal.Container size="cover">
                  <Modal.Dialog
                    aria-label={`${asset.name} preview`}
                    className={styles.assetPreviewDialog}
                  >
                    <Modal.CloseTrigger />
                    <Modal.Body className={styles.assetPreviewDialogBody}>
                      <img alt={asset.name} src={asset.path} />
                    </Modal.Body>
                  </Modal.Dialog>
                </Modal.Container>
              </Modal.Backdrop>
            </Modal>
          ) : asset.path && asset.kind === "audio" ? (
            <div className={styles.audioPreview}>
              <Icon aria-hidden="true" icon={musicIcon} />
              <AudioPlayButton name={asset.name} src={asset.path} />
            </div>
          ) : (
            <div className={styles.placeholder}>
              {asset.kind === "audio" ? (
                <Icon aria-hidden="true" icon={musicIcon} />
              ) : (
                <Icon aria-hidden="true" icon={sparkleIcon} />
              )}
              <span>{isGenerated ? "Audio asset" : "Production pending"}</span>
            </div>
          )}
        </div>

        <div className={styles.cardBody}>
          <Chip color={isGenerated ? "success" : "warning"} size="sm" variant="soft">
            <Chip.Label>{isGenerated ? "Generated" : "Pending production"}</Chip.Label>
          </Chip>
          <h3>{asset.name}</h3>
          {asset.description ? <p>{asset.description}</p> : null}
          {asset.format ? <small>{asset.format}</small> : null}
        </div>
      </Card.Content>
    </Card>
  );
}
