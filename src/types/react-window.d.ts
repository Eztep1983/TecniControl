declare module 'react-window' {
  import { Component, CSSProperties, ReactNode, ComponentType } from 'react';

  export interface ListChildComponentProps<T = any> {
    index: number;
    style: CSSProperties;
    data: T;
    isScrolling?: boolean;
  }

  export interface FixedSizeListProps<T = any> {
    className?: string;
    children: ComponentType<ListChildComponentProps<T>>;
    direction?: 'ltr' | 'rtl' | 'vertical' | 'horizontal';
    height: number | string;
    initialScrollOffset?: number;
    itemCount: number;
    itemData?: T;
    itemKey?: (index: number, data: T) => string | number;
    itemSize: number;
    layout?: 'vertical' | 'horizontal';
    onItemsRendered?: (props: {
      overscanStartIndex: number;
      overscanStopIndex: number;
      visibleStartIndex: number;
      visibleStopIndex: number;
    }) => void;
    onScroll?: (props: {
      scrollDirection: 'forward' | 'backward';
      scrollOffset: number;
      scrollUpdateWasRequested: boolean;
    }) => void;
    overscanCount?: number;
    style?: CSSProperties;
    useIsScrolling?: boolean;
    width: number | string;
  }

  export class FixedSizeList<T = any> extends Component<FixedSizeListProps<T>> {
    scrollTo(scrollOffset: number): void;
    scrollToItem(index: number, align?: 'auto' | 'smart' | 'center' | 'end' | 'start'): void;
  }
}
