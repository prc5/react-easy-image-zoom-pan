/* eslint-disable no-param-reassign */
import { ReactZoomPanPinchContext } from "../../models";
import { handleCallback } from "../../utils/callback.utils";
import { getContext } from "../../utils/context.utils";
import { cancelTimeout } from "../../utils/helpers.utils";
import { handleCancelAnimation } from "../animations/animations.utils";
import { handleCalculateBounds } from "../bounds/bounds.utils";
import {
  getDelta,
  handleCalculateWheelZoom,
  handleWheelZoomStop,
  getMousePosition,
} from "./wheel.utils";
import { handleAlignToScaleBounds } from "../zoom/zoom.logic";
import { handleCalculateZoomPositions } from "../zoom/zoom.utils";

const wheelStopEventTime = 160;
const wheelAnimationTime = 100;

export const handleWheelStart = (
  contextInstance: ReactZoomPanPinchContext,
  event: WheelEvent,
): void => {
  const { onWheelStart, onZoomStart } = contextInstance.props;

  if (!contextInstance.wheelStopEventTimer) {
    handleCancelAnimation(contextInstance);
    handleCallback(getContext(contextInstance), event, onWheelStart);
    handleCallback(getContext(contextInstance), event, onZoomStart);
  }
};

export const handleWheelZoom = (
  contextInstance: ReactZoomPanPinchContext,
  event: WheelEvent,
): void => {
  const { onWheel, onZoom } = contextInstance.props;

  const { contentComponent, setup, transformState } = contextInstance;
  const { scale } = transformState;
  const {
    centerZoomedOut,
    disablePadding,
    limitToBounds,
    smooth,
    wheel,
    zoomAnimation,
  } = setup;
  const { size, disabled } = zoomAnimation;
  const { step, smoothStep } = wheel;

  if (!contentComponent) {
    throw new Error("Component not mounted");
  }

  event.preventDefault();
  event.stopPropagation();

  const delta = getDelta(event, null);
  const zoomStep = smooth ? smoothStep * Math.abs(event.deltaY) : step;
  const newScale = handleCalculateWheelZoom(
    contextInstance,
    delta,
    zoomStep,
    !event.ctrlKey,
  );

  // if scale not change
  if (scale === newScale) return;

  const bounds = handleCalculateBounds(contextInstance, newScale);

  const mousePosition = getMousePosition(event, contentComponent, scale);

  const isPaddingDisabled =
    disabled ||
    size === 0 ||
    disablePadding ||
    centerZoomedOut ||
    bounds.maxPositionX === 0 ||
    bounds.maxPositionY === 0;
  const isLimitedToBounds = limitToBounds && isPaddingDisabled;

  const { x, y } = handleCalculateZoomPositions(
    contextInstance,
    mousePosition.x,
    mousePosition.y,
    newScale,
    bounds,
    isLimitedToBounds,
  );

  contextInstance.previousWheelEvent = event;

  contextInstance.setTransformState(newScale, x, y);

  handleCallback(getContext(contextInstance), event, onWheel);
  handleCallback(getContext(contextInstance), event, onZoom);
};

export const handleWheelStop = (
  contextInstance: ReactZoomPanPinchContext,
  event: WheelEvent,
): void => {
  const { onWheelStop, onZoomStop } = contextInstance.props;

  // fire animation
  cancelTimeout(contextInstance.wheelAnimationTimer);
  contextInstance.wheelAnimationTimer = setTimeout(() => {
    if (!contextInstance.mounted) return;
    handleAlignToScaleBounds(contextInstance, event.x, event.y);
    contextInstance.wheelAnimationTimer = null;
  }, wheelAnimationTime);

  // Wheel stop event
  const hasStoppedZooming = handleWheelZoomStop(contextInstance, event);
  if (hasStoppedZooming) {
    cancelTimeout(contextInstance.wheelStopEventTimer);
    contextInstance.wheelStopEventTimer = setTimeout(() => {
      if (!contextInstance.mounted) return;
      contextInstance.wheelStopEventTimer = null;
      handleCallback(getContext(contextInstance), event, onWheelStop);
      handleCallback(getContext(contextInstance), event, onZoomStop);
    }, wheelStopEventTime);
  }
};
