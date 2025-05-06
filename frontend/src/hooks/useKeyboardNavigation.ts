import { useState, useCallback, useEffect, RefObject } from 'react';

interface UseKeyboardNavigationProps<T> {
  items: T[];
  visible: boolean;
  setVisible: (visible: boolean) => void;
  onSelect: (item: T) => void;
  containerRef: RefObject<HTMLElement>;
}

/**
 * 드롭다운 키보드 내비게이션을 위한 커스텀 훅
 *
 * @param items 드롭다운에 표시될 항목 배열
 * @param visible 드롭다운 표시 여부
 * @param setVisible 드롭다운 표시 상태 변경 함수
 * @param onSelect 항목 선택 시 호출될 함수
 * @param containerRef 드롭다운 컨테이너에 대한 ref
 * @returns 선택된 항목의 인덱스와 항목 호버/선택 핸들러 함수들
 */
export const useKeyboardNavigation = <T>({
  items,
  visible,
  setVisible,
  onSelect,
  containerRef,
}: UseKeyboardNavigationProps<T>) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // 스크롤 조정 함수
  const scrollToItem = useCallback(
    (index: number) => {
      if (!containerRef.current) return;

      const dropdown = containerRef.current;
      const dropdownItems = dropdown.querySelectorAll('[data-dropdown-item]');

      if (index < 0 || index >= dropdownItems.length) return;

      const item = dropdownItems[index] as HTMLElement;
      const itemTop = item.offsetTop;
      const itemHeight = item.offsetHeight;
      const dropdownScrollTop = dropdown.scrollTop;
      const dropdownHeight = dropdown.clientHeight;

      // 선택된 항목이 보이는 영역 밖에 있는 경우 스크롤 조정
      if (itemTop < dropdownScrollTop) {
        // 항목이 위쪽에 있을 때
        dropdown.scrollTop = itemTop;
      } else if (itemTop + itemHeight > dropdownScrollTop + dropdownHeight) {
        // 항목이 아래쪽에 있을 때
        dropdown.scrollTop = itemTop + itemHeight - dropdownHeight;
      }
    },
    [containerRef]
  );

  // 다음 항목으로 이동
  const moveToNextItem = useCallback(() => {
    setSelectedIndex((prev) => {
      const newIndex = prev < items.length - 1 ? prev + 1 : prev;
      setTimeout(() => scrollToItem(newIndex), 0);
      return newIndex;
    });
  }, [items.length, scrollToItem]);

  // 이전 항목으로 이동
  const moveToPrevItem = useCallback(() => {
    setSelectedIndex((prev) => {
      const newIndex = prev > 0 ? prev - 1 : 0;
      setTimeout(() => scrollToItem(newIndex), 0);
      return newIndex;
    });
  }, [scrollToItem]);

  // 현재 선택된 항목 선택 확정
  const selectCurrentItem = useCallback(() => {
    if (selectedIndex >= 0 && selectedIndex < items.length) {
      onSelect(items[selectedIndex]);
    }
  }, [items, onSelect, selectedIndex]);

  // 키보드 이벤트 처리 함수
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!visible) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          moveToNextItem();
          break;
        case 'ArrowUp':
          e.preventDefault();
          moveToPrevItem();
          break;
        case 'Enter':
          e.preventDefault();
          selectCurrentItem();
          break;
        case 'Escape':
          e.preventDefault();
          setVisible(false);
          setSelectedIndex(-1);
          break;
      }
    },
    [visible, moveToNextItem, moveToPrevItem, selectCurrentItem, setVisible]
  );

  // 키보드 이벤트 리스너 등록/해제
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // 드롭다운이 닫히면 선택 인덱스 초기화
  useEffect(() => {
    if (!visible) {
      setSelectedIndex(-1);
    }
  }, [visible]);

  // 항목과 관련된 핸들러 함수들
  const handlers = {
    // 마우스가 항목 위로 이동했을 때
    handleItemMouseEnter: useCallback((index: number) => {
      setSelectedIndex(index);
    }, []),

    // 마우스가 드롭다운에서 벗어났을 때
    handleDropdownMouseLeave: useCallback(() => {
      // 마우스가 영역을 벗어나도 선택은 유지
    }, []),

    // 항목 클릭 시
    handleItemClick: useCallback(
      (item: T) => {
        onSelect(item);
      },
      [onSelect]
    ),
  };

  return {
    selectedIndex,
    ...handlers,
  };
};
