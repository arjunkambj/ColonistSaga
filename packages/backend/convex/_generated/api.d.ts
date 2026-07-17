/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as automation from "../automation.js";
import type * as games from "../games.js";
import type * as hexclave_auth from "../hexclave/auth.js";
import type * as model_commands from "../model/commands.js";
import type * as model_constants from "../model/constants.js";
import type * as model_errors from "../model/errors.js";
import type * as model_gameState from "../model/gameState.js";
import type * as model_normalize from "../model/normalize.js";
import type * as model_roomQueries from "../model/roomQueries.js";
import type * as model_types from "../model/types.js";
import type * as model_validators from "../model/validators.js";
import type * as model_views from "../model/views.js";
import type * as rooms from "../rooms.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  automation: typeof automation;
  games: typeof games;
  "hexclave/auth": typeof hexclave_auth;
  "model/commands": typeof model_commands;
  "model/constants": typeof model_constants;
  "model/errors": typeof model_errors;
  "model/gameState": typeof model_gameState;
  "model/normalize": typeof model_normalize;
  "model/roomQueries": typeof model_roomQueries;
  "model/types": typeof model_types;
  "model/validators": typeof model_validators;
  "model/views": typeof model_views;
  rooms: typeof rooms;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  stack_auth: import("@hexclave/next/_generated/component.js").ComponentApi<"stack_auth">;
};
