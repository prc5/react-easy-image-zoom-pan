import {
  RenderResult,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ReactZoomPanPinchProps, ReactZoomPanPinchRef } from "../../src";
import { Example } from "../examples/example";

interface RenderApp {
  ref: { current: ReactZoomPanPinchRef | null };
  renders: number;
  zoomInBtn: HTMLElement;
  zoomOutBtn: HTMLElement;
  resetBtn: HTMLElement;
  center: HTMLElement;
  content: HTMLElement;
  wrapper: HTMLElement;
  pan: (options: { x: number; y: number }) => void;
  touchPan: (options: { x: number; y: number }) => void;
  zoom: (options: { value: number; center?: [number, number] }) => void;
  pinch: (options: { value: number; center?: [number, number] }) => void;
}

function getPinchTouches(
  content: HTMLElement,
  center: [number, number],
  value: [number, number],
  from = 0.001,
) {
  const cx = center[0];
  const cy = center[1];

  const touches = [
    {
      pageX: 0,
      pageY: 0,
      clientX: 0,
      clientY: 0,
      target: content,
    },
    {
      pageX: cx + from + value[0],
      pageY: cy + from + value[1],
      clientX: cx + from + value[0],
      clientY: cy + from + value[1],
      target: content,
    },
  ];

  return touches;
}

export const renderApp = ({
  contentHeight,
  contentWidth,
  wrapperHeight,
  wrapperWidth,
  ...props
}: ReactZoomPanPinchProps & {
  contentWidth?: string;
  contentHeight?: string;
  wrapperWidth?: string;
  wrapperHeight?: string;
} = {}): RenderResult & RenderApp => {
  let renders = 0;
  let ref: { current: ReactZoomPanPinchRef | null } = { current: null };

  const onRender = () => {
    renders += 1;
  };

  const exampleProps: ReactZoomPanPinchProps = {
    doubleClick: {
      disabled: true,
    },
    alignmentAnimation: {
      disabled: true,
    },
    ...props,
    ref: (r) => {
      ref.current = r;
    },
  };

  const view = render(
    <Example
      props={exampleProps}
      onRender={onRender}
      {...{ contentHeight, contentWidth, wrapperHeight, wrapperWidth }}
    />,
  );
  // // controls buttons
  const zoomInBtn = screen.getByTestId("zoom-in");
  const zoomOutBtn = screen.getByTestId("zoom-out");
  const resetBtn = screen.getByTestId("reset");
  const center = screen.getByTestId("center");
  // containers
  const content = screen.getByTestId("content");
  const wrapper = screen.getByTestId("wrapper");

  const zoom: RenderApp["zoom"] = (options) => {
    const { value, center } = options;
    if (!ref.current) throw new Error("ref.current is null");

    userEvent.hover(content);
    if (center) {
      fireEvent.mouseMove(content, { clientX: center[0], clientY: center[1] });
    }

    const step = 1;

    const isZoomIn = ref.current.instance.state.scale < value;
    while (true) {
      if (
        (isZoomIn
          ? ref.current.instance.state.scale < value
          : ref.current.instance.state.scale > value) &&
        ref.current.instance.state.scale !== value
      ) {
        const isNearScale =
          Math.abs(ref.current.instance.state.scale - value) < 0.01;

        const newStep = isNearScale ? 0.35 : step;

        fireEvent(
          content,
          new WheelEvent("wheel", {
            bubbles: true,
            deltaY: isZoomIn ? -newStep : newStep,
          }),
        );
      } else {
        break;
      }
    }
  };

  const pinch: RenderApp["pinch"] = (options) => {
    const { value, center = [0, 0] } = options;
    if (!ref.current) throw new Error("ref.current is null");

    const isZoomIn = ref.current.instance.state.scale < value;
    const from = isZoomIn ? 40 : 200;
    const stepY = 0.1;
    const stepX = 0.1;

    let pinchValue = [0, 0];
    let touches = getPinchTouches(content, center, [stepX, stepY], from);

    fireEvent.touchStart(content, {
      touches,
    });

    while (true) {
      if (
        (isZoomIn
          ? ref.current.instance.state.scale < value
          : ref.current.instance.state.scale > value) &&
        ref.current.instance.state.scale !== value
      ) {
        const isNearScale =
          Math.abs(ref.current.instance.state.scale - value) < 0.5;

        const newStepX = isNearScale ? stepX / 10 : stepX;
        const newStepY = isNearScale ? stepY / 10 : stepY;

        pinchValue[0] = pinchValue[0] + newStepX;
        pinchValue[1] = pinchValue[1] + newStepY;
        touches = getPinchTouches(
          content,
          center,
          [pinchValue[0], pinchValue[1]],
          from,
        );
        fireEvent.touchMove(content, {
          touches,
        });
      } else {
        break;
      }
    }

    fireEvent.touchEnd(content);
  };

  const pan: RenderApp["pan"] = ({ x, y }) => {
    userEvent.hover(content);
    fireEvent.mouseDown(content);
    fireEvent.mouseMove(content, { clientX: x, clientY: y });
    fireEvent.mouseUp(content);
    fireEvent.blur(content);
  };

  const touchPan: RenderApp["touchPan"] = ({ x, y }) => {
    const touches = [
      {
        pageX: 0,
        pageY: 0,
        clientX: 0,
        clientY: 0,
        target: content,
      },
    ];
    fireEvent.touchStart(content, {
      touches,
    });
    fireEvent.touchMove(content, {
      touches: [
        {
          pageX: x,
          pageY: y,
          clientX: x,
          clientY: y,
          target: content,
        },
      ],
    });
    fireEvent.touchEnd(content);
  };

  return {
    ...view,
    ref,
    renders,
    zoomInBtn,
    zoomOutBtn,
    resetBtn,
    center,
    content,
    wrapper,
    zoom,
    pan,
    pinch,
    touchPan,
  };
};
