/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {AriaSwitchProps, mergeProps, useFocusRing, useHover, usePress, useSwitch, VisuallyHidden} from 'react-aria';
import {ContextValue, forwardRefType, RenderProps, SlotProps, useContextProps, useRenderProps} from './utils';
import {filterDOMProps} from '@react-aria/utils';
import React, {createContext, ForwardedRef, forwardRef, useState} from 'react';
import {useToggleState} from 'react-stately';

export interface SwitchProps extends Omit<AriaSwitchProps, 'children'>, RenderProps<SwitchRenderProps>, SlotProps {}

export interface SwitchRenderProps {
  /**
   * Whether the switch is selected.
   * @selector [data-selected]
   */
  isSelected: boolean,
  /**
   * Whether the switch is currently hovered with a mouse.
   * @selector [data-hovered]
   */
  isHovered: boolean,
  /**
   * Whether the switch is currently in a pressed state.
   * @selector [data-pressed]
   */
  isPressed: boolean,
  /**
   * Whether the switch is focused, either via a mouse or keyboard.
   * @selector [data-focused]
   */
  isFocused: boolean,
  /**
   * Whether the switch is keyboard focused.
   * @selector [data-focus-visible]
   */
  isFocusVisible: boolean,
  /**
   * Whether the switch is disabled.
   * @selector [data-disabled]
   */
  isDisabled: boolean,
  /**
   * Whether the switch is read only.
   * @selector [data-readonly]
   */
  isReadOnly: boolean
}

export const SwitchContext = createContext<ContextValue<SwitchProps, HTMLInputElement>>(null);

function Switch(props: SwitchProps, ref: ForwardedRef<HTMLInputElement>) {
  [props, ref] = useContextProps(props, ref, SwitchContext);
  let state = useToggleState(props);
  let {inputProps, isSelected, isDisabled, isReadOnly, isPressed: isPressedKeyboard} = useSwitch({
    ...props,
    // ReactNode type doesn't allow function children.
    children: typeof props.children === 'function' ? true : props.children
  }, state, ref);
  let {isFocused, isFocusVisible, focusProps} = useFocusRing();
  let isInteractionDisabled = props.isDisabled || props.isReadOnly;

  // Handle press state for full label. Keyboard press state is returned by useSwitch
  // since it is handled on the <input> element itself.
  let [isPressed, setPressed] = useState(false);
  let {pressProps} = usePress({
    isDisabled: isInteractionDisabled,
    onPressStart(e) {
      if (e.pointerType !== 'keyboard') {
        setPressed(true);
      }
    },
    onPressEnd(e) {
      if (e.pointerType !== 'keyboard') {
        setPressed(false);
      }
    }
  });

  let {hoverProps, isHovered} = useHover({
    isDisabled: isInteractionDisabled
  });

  let pressed = isInteractionDisabled ? false : (isPressed || isPressedKeyboard);

  let renderProps = useRenderProps({
    ...props,
    defaultClassName: 'react-aria-Switch',
    values: {
      isSelected,
      isPressed: pressed,
      isHovered,
      isFocused,
      isFocusVisible,
      isDisabled,
      isReadOnly
    }
  });

  let DOMProps = filterDOMProps(props);
  delete DOMProps.id;

  return (
    <label
      {...mergeProps(DOMProps, pressProps, hoverProps, renderProps)}
      slot={props.slot}
      data-selected={isSelected || undefined}
      data-pressed={pressed || undefined}
      data-hovered={isHovered || undefined}
      data-focused={isFocused || undefined}
      data-focus-visible={isFocusVisible || undefined}
      data-disabled={isDisabled || undefined}
      data-readonly={isReadOnly || undefined}>
      <VisuallyHidden elementType="span">
        <input {...inputProps} {...focusProps} ref={ref} />
      </VisuallyHidden>
      {renderProps.children}
    </label>
  );
}

/**
 * A switch allows a user to turn a setting on or off.
 */
const _Switch = /*#__PURE__*/ (forwardRef as forwardRefType)(Switch);
export {_Switch as Switch};
