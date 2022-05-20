import { assert } from "@ember/debug";
import { registerDestructor } from "@ember/destroyable";

import Modifier from "ember-modifier";

import type { RefreshState } from "../components/pull-to-refresh";

function easeOutBack(x: number): number {
  const c1 = 1.701_58;
  const c3 = c1 + 1;

  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function cleanup(instance: ScrollModifier) {
  const { _element, startHandler, endHandler, moveHandler, cancelHandler } =
    instance;

  if (_element) {
    instance._element = null;

    if (startHandler) {
      _element.removeEventListener("touchstart", startHandler);
      instance.startHandler = null;
    }
    if (moveHandler) {
      _element.removeEventListener("touchmove", moveHandler);
      instance.moveHandler = null;
    }
    if (endHandler) {
      _element.removeEventListener("touchend", endHandler);
      instance.endHandler = null;
    }
    if (cancelHandler) {
      _element.removeEventListener("touchcancel", cancelHandler);
      instance.cancelHandler = null;
    }
  }
}

type ModPosArgs = [number, (fn: () => void) => void, RefreshState];

export default class ScrollModifier extends Modifier<{
  Args: {
    Positional: ModPosArgs;
  };
}> {
  _element: Element | null = null;
  scrollBoxId!: string;
  startHandler: null | ((event: Event) => void) = null;
  moveHandler: null | ((event: Event) => void) = null;
  endHandler: null | ((event: Event) => void) = null;
  cancelHandler: null | ((event: Event) => void) = null;

  modify(
    element: HTMLElement,
    [triggerThreshold, refreshAction, state]: ModPosArgs
  ) {
    assert(`Did not expect to be reinitialized`, !this._element);
    this._element = element;
    let startEvent: TouchEvent | null = null;
    let touchIsInScrollable = false;
    let windowHeight = 0;
    let hasTriggered = false;
    const cleanup = () => {
      startEvent = null;
      touchIsInScrollable = false;
      windowHeight = 0;
      hasTriggered = false;
      element.style.transform = "";
      state.request = null;
    };
    const yieldedCleanup = () => {
      setTimeout(() => {
        state.isRefreshing = false;
        setTimeout(() => {
          if (!state.isPulling) {
            cleanup();
          }
        }, 1500);
      }, 1500);
    };
    const scrollElement = element.querySelector(".page-scroll");
    assert(`Expected a page-scroll element`, scrollElement);

    this.startHandler = (event: Event) => {
      const { target } = event;
      assert(
        `Expected touch event handler to receive a TouchEvent`,
        event instanceof TouchEvent
      );
      assert(`Expected to not have an active start event`, startEvent === null);
      assert(
        `expected event to have a target`,
        target !== null && target instanceof HTMLElement
      );
      startEvent = event;
      touchIsInScrollable = !!target.closest(".page-scroll");
      windowHeight = window.innerHeight;
      element.style.transition = "";
      hasTriggered = false;
      state.isPulling = true;

      element.addEventListener("touchmove", this.moveHandler!, {
        passive: true,
        capture: true,
      });
      element.addEventListener("touchend", this.endHandler!, {
        passive: true,
        capture: true,
      });
      element.addEventListener("touchcancel", this.cancelHandler!, {
        passive: true,
        capture: true,
      });
    };

    this.moveHandler = (event: Event) => {
      assert(
        `Expected touch event handler to receive a TouchEvent`,
        event instanceof TouchEvent
      );
      assert(`Expected an active start event`, startEvent !== null);
      if (touchIsInScrollable && scrollElement.scrollTop !== 0) {
        return;
      }
      const startOffset = startEvent.targetTouches[0].clientY;
      const endOffset = event.targetTouches[0].clientY;
      let delta = endOffset - startOffset;

      if (delta >= 0) {
        const max = windowHeight;
        if (delta > max) {
          delta = max;
        }
        const progress = delta / max;
        const newY = easeOutBack(progress);
        const movement = Math.round(0.25 * newY * max);

        if (movement > triggerThreshold && !hasTriggered) {
          hasTriggered = true;
          state.isRefreshing = true;
          refreshAction(yieldedCleanup);
        }
        const newStyle = `translateY(${movement}px)`;
        element.style.transform = newStyle;
      }
    };

    this.endHandler = (event: Event) => {
      assert(
        `Expected touch event handler to receive a TouchEvent`,
        event instanceof TouchEvent
      );
      assert(`Expected an active start event`, startEvent !== null);
      console.log({ end: event });

      state.isPulling = false;
      element.style.transition = "transform 0.4s ease-in";
      if (!state.isRefreshing) {
        cleanup();
      } else {
        element.style.transform = "translateY(10vh)";
      }
      element.removeEventListener("touchmove", this.moveHandler!);
      element.removeEventListener("touchcancel", this.cancelHandler!);
      element.removeEventListener("touchend", this.endHandler!);
    };

    this.cancelHandler = (event: Event) => {
      assert(
        `Expected touch event handler to receive a TouchEvent`,
        event instanceof TouchEvent
      );
      assert(`Expected an active start event`, startEvent !== null);
      console.log({ cancel: event });
      startEvent = null;
      element.removeEventListener("touchmove", this.moveHandler!);
      element.removeEventListener("touchcancel", this.cancelHandler!);
      element.removeEventListener("touchend", this.endHandler!);
    };

    element.addEventListener("touchstart", this.startHandler, {
      passive: true,
      capture: true,
    });
    registerDestructor(this, cleanup);
  }
}
