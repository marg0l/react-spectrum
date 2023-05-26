/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {DOMAttributes, FocusableElement} from '@react-types/shared';
import {getColumnHeaderId} from './utils';
import {GridNode} from '@react-types/grid';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {isAndroid, mergeProps, useDescription, useLayoutEffect} from '@react-aria/utils';
import {RefObject, useRef, useState} from 'react';
import {TableState} from '@react-stately/table';
import {useFocusable} from '@react-aria/focus';
import {useGridCell} from '@react-aria/grid';
import {useLocalizedStringFormatter} from '@react-aria/i18n';
import {usePress} from '@react-aria/interactions';

export interface AriaTableColumnHeaderProps<T> {
  /** An object representing the [column header](https://www.w3.org/TR/wai-aria-1.1/#columnheader). Contains all the relevant information that makes up the column header. */
  node: GridNode<T>,
  /** Whether the [column header](https://www.w3.org/TR/wai-aria-1.1/#columnheader) is contained in a virtual scroller. */
  isVirtualized?: boolean
}

export interface TableColumnHeaderAria {
  /** Props for the [column header](https://www.w3.org/TR/wai-aria-1.1/#columnheader) element. */
  columnHeaderProps: DOMAttributes
}

/**
 * Provides the behavior and accessibility implementation for a column header in a table.
 * @param props - Props for the column header.
 * @param state - State of the table, as returned by `useTableState`.
 * @param ref - The ref attached to the column header element.
 */
export function useTableColumnHeader<T>(props: AriaTableColumnHeaderProps<T>, state: TableState<T>, ref: RefObject<FocusableElement>): TableColumnHeaderAria {
  let {node} = props;
  let allowsSorting = node.props.allowsSorting;
  // if there are no focusable children, the column header will focus the cell
  let {gridCellProps} = useGridCell({...props, focusMode: 'child'}, state, ref);

  let isSelectionCellDisabled = node.props.isSelectionCell && state.selectionManager.selectionMode === 'single';

  let {pressProps} = usePress({
    isDisabled: !allowsSorting || isSelectionCellDisabled,
    onPress() {
      state.sort(node.key);
    },
    ref
  });

  // Needed to pick up the focusable context, enabling things like Tooltips for example
  let {focusableProps} = useFocusable({}, ref);

  let ariaSort: DOMAttributes['aria-sort'] = null;
  let isSortedColumn = state.sortDescriptor?.column === node.key;
  let sortDirection = state.sortDescriptor?.direction;
  // aria-sort not supported in Android Talkback
  if (node.props.allowsSorting && !isAndroid()) {
    ariaSort = isSortedColumn ? sortDirection : 'none';
  }

  let stringFormatter = useLocalizedStringFormatter(intlMessages);
  let sortDescription;
  if (allowsSorting) {
    sortDescription = `${stringFormatter.format('sortable')}`;
    // Android Talkback doesn't support aria-sort so we add sort order details to the aria-described by here
    if (isSortedColumn && sortDirection && isAndroid()) {
      sortDescription = `${sortDescription}, ${stringFormatter.format(sortDirection)}`;
    }
  }

  let descriptionProps = useDescription(sortDescription);

  let shouldDisableFocus = (state.collection.size === 0 &&
    state.collection.body.props.loadingState !== 'loading' &&
    state.collection.body.props.loadingState !== 'loadingMore');
  // delay disabling focus so we get a blur event on the cell to clean up the focus ring
  let [disableFocus, setDisableFocus]  = useState(shouldDisableFocus);

  useLayoutEffect(() => {
    if (shouldDisableFocus && !disableFocus && ref.current === document.activeElement) {
      ref.current?.blur();
    }
    setDisableFocus(shouldDisableFocus);
  }, [shouldDisableFocus, disableFocus]);

  return {
    columnHeaderProps: {
      ...mergeProps(
        gridCellProps,
        pressProps,
        focusableProps,
        descriptionProps,
        // If the table is empty, make all column headers untabbable or programatically focusable
        shouldDisableFocus && disableFocus && {tabIndex: null}
      ),
      role: 'columnheader',
      id: getColumnHeaderId(state, node.key),
      'aria-colspan': node.colspan && node.colspan > 1 ? node.colspan : null,
      'aria-sort': ariaSort
    }
  };
}
