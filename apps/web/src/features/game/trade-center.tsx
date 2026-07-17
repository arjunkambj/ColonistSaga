"use client";

import {
  RESOURCE_ORDER,
  emptyInventory,
  type GameCommand,
  type PlayerGameView,
  type PrivatePlayerState,
  type ResourceInventory,
  type ResourceType,
} from "@catansaga/game";
import { Button, Checkbox, Description, Modal, Tabs } from "@heroui/react";
import { ArrowRightLeft, Check, Handshake, Minus, Plus, Store, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { RESOURCE_LABELS, ResourceIcon } from "./resource-icon";

interface TradeCenterProps {
  disabled: boolean;
  game: PlayerGameView;
  me: PrivatePlayerState;
  onCommand(command: GameCommand, message: string): void;
}

type TradeTab = "bank" | "players";

export function TradeCenter({ disabled, game, me, onCommand }: TradeCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<TradeTab>("players");
  const offerNeedsViewer = game.legalActions.canCancelTrade || game.legalActions.canRespondToTrade;
  const showDialog = isOpen || offerNeedsViewer;

  return (
    <Modal>
      <Button
        aria-controls="trade-dialog"
        aria-expanded={showDialog}
        aria-haspopup="dialog"
        className="action-button trade-launch"
        isDisabled={disabled}
        onPress={() => setIsOpen(true)}
        variant="secondary"
      >
        <Handshake aria-hidden="true" />
        <strong>Trade</strong>
        <span>{game.tradeOffer ? "Offer open" : "Bank or players"}</span>
      </Button>

      <Modal.Backdrop
        className="trade-backdrop"
        isDismissable={!offerNeedsViewer}
        isKeyboardDismissDisabled={offerNeedsViewer}
        isOpen={showDialog}
        onOpenChange={(open) => {
          if (!open && !offerNeedsViewer) {
            setIsOpen(open);
          }
        }}
      >
        <Modal.Container>
          <Modal.Dialog className="trade-dialog" id="trade-dialog">
            <div className="trade-illustration" aria-hidden="true">
              <Image
                alt=""
                fill
                sizes="(max-width: 720px) 88vw, 300px"
                src="/game-assets/ui/trade-caravan.png"
              />
            </div>

            <Modal.Header className="trade-header">
              <div>
                <p className="eyebrow">Island Market</p>
                <Modal.Heading id="trade-title">Make a Trade</Modal.Heading>
                <p id="trade-description">
                  Choose an exact exchange. Nothing moves until the deal is confirmed.
                </p>
              </div>
              <Button
                aria-label="Close trade window"
                className="trade-close"
                isDisabled={offerNeedsViewer}
                isIconOnly
                onPress={() => setIsOpen(false)}
                variant="ghost"
              >
                <X aria-hidden="true" />
              </Button>
            </Modal.Header>

            <Modal.Body className="trade-body">
              {game.tradeOffer ? (
                <ActiveTradeOffer disabled={disabled} game={game} me={me} onCommand={onCommand} />
              ) : (
                <Tabs onSelectionChange={(key) => setTab(key as TradeTab)} selectedKey={tab}>
                  <Tabs.ListContainer className="trade-tabs">
                    <Tabs.List aria-label="Trade partner">
                      <Tabs.Tab id="players">
                        <Handshake aria-hidden="true" /> Players
                        <Tabs.Indicator />
                      </Tabs.Tab>
                      <Tabs.Tab id="bank">
                        <Store aria-hidden="true" /> Bank & Ports
                        <Tabs.Indicator />
                      </Tabs.Tab>
                    </Tabs.List>
                  </Tabs.ListContainer>
                  <Tabs.Panel id="bank">
                    <BankTradeForm disabled={disabled} game={game} onCommand={onCommand} />
                  </Tabs.Panel>
                  <Tabs.Panel id="players">
                    <PlayerTradeForm
                      disabled={disabled}
                      game={game}
                      me={me}
                      onCommand={onCommand}
                    />
                  </Tabs.Panel>
                </Tabs>
              )}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function BankTradeForm({
  disabled,
  game,
  onCommand,
}: Pick<TradeCenterProps, "disabled" | "game" | "onCommand">) {
  const [give, setGive] = useState<ResourceType>("tree");
  const [receive, setReceive] = useState<ResourceType>("brick");
  const options = game.legalActions.bankTrades;
  const availableGiveResources = RESOURCE_ORDER.filter((resource) =>
    options.some((option) => option.give === resource),
  );
  const selectedGive = availableGiveResources.includes(give)
    ? give
    : (availableGiveResources[0] ?? give);
  const availableReceiveResources = RESOURCE_ORDER.filter((resource) =>
    options.some((option) => option.give === selectedGive && option.receive === resource),
  );
  const selectedReceive = availableReceiveResources.includes(receive)
    ? receive
    : (availableReceiveResources[0] ?? receive);
  const selectedTrade = options.find(
    (option) => option.give === selectedGive && option.receive === selectedReceive,
  );
  const ratio =
    selectedTrade?.ratio ?? options.find((option) => option.give === selectedGive)?.ratio;
  const displayRatio = ratio ?? 4;

  return (
    <div className="trade-form">
      <p className="trade-guidance">
        Your best bank or harbor rate is applied automatically. Select one resource on each side.
      </p>
      <div className="bank-trade-columns">
        <ResourceChoice
          disabled={disabled}
          label={`Give ${displayRatio}`}
          onChange={setGive}
          options={availableGiveResources}
          selected={selectedGive}
        />
        <ArrowRightLeft className="trade-exchange-icon" aria-hidden="true" />
        <ResourceChoice
          disabled={disabled}
          label="Receive 1"
          onChange={setReceive}
          options={availableReceiveResources}
          selected={selectedReceive}
        />
      </div>
      <Button
        className="button button-primary trade-submit"
        isDisabled={disabled || !selectedTrade}
        onPress={() =>
          onCommand(
            { give: selectedGive, kind: "trade_bank", receive: selectedReceive },
            "Bank trade completed.",
          )
        }
      >
        <Check aria-hidden="true" /> Confirm {displayRatio}:1 Trade
      </Button>
    </div>
  );
}

function ResourceChoice({
  disabled,
  label,
  onChange,
  options,
  selected,
}: {
  disabled: boolean;
  label: string;
  onChange(resource: ResourceType): void;
  options: readonly ResourceType[];
  selected: ResourceType;
}) {
  return (
    <fieldset className="resource-choice">
      <legend>{label}</legend>
      <div>
        {RESOURCE_ORDER.map((resource) => {
          const isAvailable = options.includes(resource);
          const isSelected = isAvailable && selected === resource;
          return (
            <Button
              aria-label={`${label}: ${RESOURCE_LABELS[resource]}`}
              aria-pressed={isSelected}
              className={isSelected ? "is-selected" : ""}
              isDisabled={disabled || !isAvailable}
              key={resource}
              onPress={() => onChange(resource)}
              variant="ghost"
            >
              <ResourceIcon decorative resource={resource} size={42} />
              <span>{RESOURCE_LABELS[resource]}</span>
            </Button>
          );
        })}
      </div>
    </fieldset>
  );
}

function PlayerTradeForm({ disabled, game, me, onCommand }: TradeCenterProps) {
  const [give, setGive] = useState<ResourceInventory>(() => emptyInventory());
  const [want, setWant] = useState<ResourceInventory>(() => emptyInventory());
  const [recipientPlayerIds, setRecipientPlayerIds] = useState<string[]>(() =>
    game.players.filter((player) => player.id !== me.id).map((player) => player.id),
  );
  const hasGive = inventoryTotal(give) > 0;
  const hasWant = inventoryTotal(want) > 0;
  const hasNoOverlap = RESOURCE_ORDER.every(
    (resource) => give[resource] === 0 || want[resource] === 0,
  );
  const canSubmit =
    game.legalActions.canProposeTrade &&
    hasGive &&
    hasWant &&
    hasNoOverlap &&
    recipientPlayerIds.length > 0 &&
    RESOURCE_ORDER.every((resource) => give[resource] <= me.resources[resource]);

  const toggleRecipient = (playerId: string) => {
    setRecipientPlayerIds((current) =>
      current.includes(playerId)
        ? current.filter((candidate) => candidate !== playerId)
        : [...current, playerId],
    );
  };

  return (
    <div className="trade-form">
      <div className="player-trade-grid">
        <InventoryPicker
          disabled={disabled}
          excludedResources={want}
          inventory={give}
          label="You give"
          limits={me.resources}
          onChange={setGive}
        />
        <ArrowRightLeft className="trade-exchange-icon" aria-hidden="true" />
        <InventoryPicker
          disabled={disabled}
          excludedResources={give}
          inventory={want}
          label="You receive"
          onChange={setWant}
        />
      </div>

      <fieldset className="trade-recipients">
        <legend>Offer to</legend>
        <div>
          {game.players
            .filter((player) => player.id !== me.id)
            .map((player) => (
              <Checkbox
                isDisabled={disabled}
                isSelected={recipientPlayerIds.includes(player.id)}
                key={player.id}
                name="tradeRecipient"
                onChange={() => toggleRecipient(player.id)}
                value={player.id}
              >
                <Checkbox.Content>
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <span>{player.displayName}</span>
                </Checkbox.Content>
                <Description className="trade-recipient-description">
                  {player.isBot ? "Bot" : "Player"}
                </Description>
              </Checkbox>
            ))}
        </div>
      </fieldset>

      <Button
        className="button button-primary trade-submit"
        isDisabled={disabled || !canSubmit}
        onPress={() =>
          onCommand({ give, kind: "propose_trade", recipientPlayerIds, want }, "Trade offer sent.")
        }
      >
        <Handshake aria-hidden="true" /> Send Offer
      </Button>
    </div>
  );
}

function InventoryPicker({
  disabled,
  excludedResources,
  inventory,
  label,
  limits,
  onChange,
}: {
  disabled: boolean;
  excludedResources?: Readonly<ResourceInventory>;
  inventory: ResourceInventory;
  label: string;
  limits?: Readonly<ResourceInventory>;
  onChange(inventory: ResourceInventory): void;
}) {
  const update = (resource: ResourceType, change: number) => {
    const maximum = limits?.[resource] ?? 19;
    onChange({
      ...inventory,
      [resource]: Math.max(0, Math.min(maximum, inventory[resource] + change)),
    });
  };

  return (
    <fieldset className="inventory-picker">
      <legend>{label}</legend>
      <div>
        {RESOURCE_ORDER.map((resource) => (
          <div key={resource}>
            <ResourceIcon decorative resource={resource} size={38} />
            <span>{RESOURCE_LABELS[resource]}</span>
            <div className="trade-stepper">
              <Button
                aria-label={`Remove one ${RESOURCE_LABELS[resource]} from ${label.toLowerCase()}`}
                isDisabled={disabled || inventory[resource] === 0}
                isIconOnly
                onPress={() => update(resource, -1)}
                variant="ghost"
              >
                <Minus aria-hidden="true" />
              </Button>
              <output aria-live="polite">{inventory[resource]}</output>
              <Button
                aria-label={`Add one ${RESOURCE_LABELS[resource]} to ${label.toLowerCase()}`}
                isDisabled={
                  disabled ||
                  (excludedResources?.[resource] ?? 0) > 0 ||
                  inventory[resource] >= (limits?.[resource] ?? 19)
                }
                isIconOnly
                onPress={() => update(resource, 1)}
                variant="ghost"
              >
                <Plus aria-hidden="true" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

function ActiveTradeOffer({ disabled, game, me, onCommand }: TradeCenterProps) {
  const offer = game.tradeOffer;
  if (!offer) {
    return null;
  }

  const proposer = game.players.find((player) => player.id === offer.proposerPlayerId);
  const viewerIsProposer = game.viewerPlayerId === offer.proposerPlayerId;
  const viewerCanAfford = RESOURCE_ORDER.every(
    (resource) => me.resources[resource] >= offer.want[resource],
  );

  return (
    <div className="active-trade-offer">
      <div className="offer-title">
        <span className="offer-avatar" aria-hidden="true">
          {proposer?.displayName.slice(0, 1).toUpperCase() ?? "?"}
        </span>
        <div>
          <p className="eyebrow">Open Offer</p>
          <h3>
            {viewerIsProposer
              ? "Your offer is waiting"
              : `${proposer?.displayName ?? "A player"} proposes`}
          </h3>
        </div>
      </div>

      <div className="offer-exchange">
        <OfferInventory inventory={viewerIsProposer ? offer.give : offer.want} label="You give" />
        <ArrowRightLeft aria-hidden="true" />
        <OfferInventory
          inventory={viewerIsProposer ? offer.want : offer.give}
          label="You receive"
        />
      </div>

      {viewerIsProposer ? (
        <ul aria-label="Trade responses" className="trade-recipient-status">
          {offer.recipientPlayerIds.map((playerId) => {
            const player = game.players.find((candidate) => candidate.id === playerId);
            const rejected = offer.rejectedPlayerIds.includes(playerId);
            return (
              <li className={rejected ? "is-rejected" : "is-waiting"} key={playerId}>
                <span>{player?.displayName ?? "Invited player"}</span>
                <strong>{rejected ? "Declined" : "Waiting"}</strong>
              </li>
            );
          })}
        </ul>
      ) : null}

      {game.legalActions.canRespondToTrade ? (
        <>
          {!viewerCanAfford ? (
            <p className="trade-affordability" id="trade-affordability">
              You need every requested resource before you can accept this offer.
            </p>
          ) : null}
          <div className="offer-actions">
            <Button
              className="button button-secondary"
              isDisabled={disabled}
              onPress={() =>
                onCommand(
                  {
                    accept: false,
                    kind: "respond_trade",
                    offerActionNumber: offer.offerActionNumber,
                  },
                  "Trade declined.",
                )
              }
              variant="secondary"
            >
              <X aria-hidden="true" /> Decline
            </Button>
            <Button
              aria-describedby={!viewerCanAfford ? "trade-affordability" : undefined}
              className="button button-primary"
              isDisabled={disabled || !viewerCanAfford}
              onPress={() =>
                onCommand(
                  {
                    accept: true,
                    kind: "respond_trade",
                    offerActionNumber: offer.offerActionNumber,
                  },
                  "Trade accepted.",
                )
              }
            >
              <Check aria-hidden="true" /> Accept Trade
            </Button>
          </div>
        </>
      ) : game.legalActions.canCancelTrade ? (
        <Button
          className="button button-secondary trade-submit"
          isDisabled={disabled}
          onPress={() =>
            onCommand(
              { kind: "cancel_trade", offerActionNumber: offer.offerActionNumber },
              "Trade offer cancelled.",
            )
          }
          variant="secondary"
        >
          <X aria-hidden="true" /> Cancel Offer
        </Button>
      ) : (
        <p className="trade-waiting" role="status">
          {offer.rejectedPlayerIds.includes(game.viewerPlayerId)
            ? "You declined this offer. Waiting for another invited player…"
            : "Waiting for an invited player to answer…"}
        </p>
      )}
    </div>
  );
}

function OfferInventory({ inventory, label }: { inventory: ResourceInventory; label: string }) {
  const resources = RESOURCE_ORDER.filter((resource) => inventory[resource] > 0);
  return (
    <section>
      <h4>{label}</h4>
      <ul>
        {resources.map((resource) => (
          <li key={resource}>
            <ResourceIcon decorative resource={resource} size={42} />
            <strong>{inventory[resource]}</strong>
            <span>{RESOURCE_LABELS[resource]}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function inventoryTotal(inventory: ResourceInventory): number {
  return RESOURCE_ORDER.reduce((total, resource) => total + inventory[resource], 0);
}
