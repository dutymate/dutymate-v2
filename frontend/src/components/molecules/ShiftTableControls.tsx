import { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { Tooltip } from '@/components/atoms/Tooltip';
import KeyboardGuide from '@/components/atoms/KeyboardGuide';
import useUserAuthStore from '@/stores/userAuthStore';
import { getDefaultOffDays } from '@/utils/dateUtils';

interface ShiftTableControlsProps {
  year: number;
  month: number;
  autoGenCnt: number;
  isExporting: boolean;
  isAllCellsEmpty: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onReset: () => void;
  onRuleClick: () => void;
  onAutoCreate: () => void;
  onDownloadImage: () => void;
  onDownloadExcel: () => void;
}

/**
 * 모바일용 상단 컨트롤 컴포넌트
 */
export const MobileShiftControls = ({
  year,
  month,
  isExporting,
  onPrevMonth,
  onNextMonth,
  onReset,
  onRuleClick,
  onAutoCreate,
  onDownloadImage,
  onDownloadExcel,
}: ShiftTableControlsProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { userInfo } = useUserAuthStore();
  const isDemo = userInfo?.isDemo;

  return (
    <div className="bg-white rounded-xl py-2 px-3 mb-2 flex items-center justify-between">
      {/* 왼쪽: 월 선택 및 기본 OFF */}
      <div className="flex items-center gap-2">
        <Icon
          name="left"
          size={16}
          className="cursor-pointer text-gray-600"
          onClick={onPrevMonth}
        />
        <span className="text-base font-medium">{month}월</span>
        <Icon
          name="right"
          size={16}
          className="cursor-pointer text-gray-600"
          onClick={onNextMonth}
        />
        <div className="flex items-center gap-1 ml-2 text-xs">
          <span className="text-gray-400">기본 OFF</span>
          <span className="font-bold text-black">
            {getDefaultOffDays(year, month)}
          </span>
          <span>일</span>
        </div>
      </div>

      {/* 오른쪽: 드롭다운 메뉴 */}
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <Icon name="more" size={20} className="text-gray-600" />
        </button>

        {/* 드롭다운 메뉴와 오버레이 */}
        {isDropdownOpen && (
          <>
            {/* 오버레이 - 외부 클릭 시 닫힘 */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsDropdownOpen(false)}
            />

            {/* 드롭다운 메뉴 */}
            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg z-50 min-w-[8rem] py-1">
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  onReset();
                }}
                className="w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Icon name="reset" size={16} />
                <span>초기화</span>
              </button>
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  onRuleClick();
                }}
                className="w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Icon name="rule" size={16} />
                <span>규칙 설정</span>
              </button>
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  onAutoCreate();
                }}
                className="w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Icon name="auto" size={16} />
                <span>자동 생성</span>
              </button>
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  onDownloadImage();
                }}
                className={`w-full px-3 py-2 text-sm text-left ${
                  isDemo || isExporting
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                disabled={isDemo || isExporting}
              >
                이미지 다운로드
              </button>
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  onDownloadExcel();
                }}
                className={`w-full px-3 py-2 text-sm text-left ${
                  isDemo || isExporting
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                disabled={isDemo || isExporting}
              >
                엑셀로 다운로드
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * 웹용 상단 컨트롤 컴포넌트
 */
export const DesktopShiftControls = ({
  year,
  month,
  isExporting,
  isAllCellsEmpty,
  onPrevMonth,
  onNextMonth,
  onReset,
  onRuleClick,
  onAutoCreate,
  onDownloadImage,
  onDownloadExcel,
}: ShiftTableControlsProps) => {
  const [showWebDownloadDropdown, setShowWebDownloadDropdown] = useState(false);
  const { userInfo } = useUserAuthStore();
  const isDemo = userInfo?.isDemo;

  return (
    <div className="bg-white rounded-xl py-[0.5rem] px-[0.5rem] mb-[0.1875rem]">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex ml-[0.75rem] items-center gap-[0.75rem]">
            <Icon
              name="left"
              size={16}
              className="cursor-pointer text-gray-600 hover:text-gray-800"
              onClick={onPrevMonth}
            />
            <span className="text-lg font-medium">{month}월</span>
            <Icon
              name="right"
              size={16}
              className="cursor-pointer text-gray-600 hover:text-gray-800"
              onClick={onNextMonth}
            />
            <div className="flex items-center gap-2 ml-1">
              <span className="text-[11px] sm:text-xs text-gray-400">
                기본 OFF
              </span>
              <span className="text-[12px] sm:text-sm font-bold text-black">
                {getDefaultOffDays(year, month)}
              </span>
              <span className="text-foreground">일</span>
            </div>
            <div>
              <button
                className={`flex items-center gap-1 text-gray-400 hover:text-gray-600 px-2 py-1 rounded-md ${
                  isAllCellsEmpty
                    ? 'opacity-50 cursor-not-allowed hover:bg-transparent hover:text-gray-400'
                    : 'hover:bg-gray-100'
                }`}
                onClick={onReset}
              >
                <Icon name="reset" size={16} />
                <span className="text-sm whitespace-nowrap">초기화</span>
              </button>
            </div>
          </div>
        </div>
        {/* 버튼 영역 */}
        <div className="flex gap-1 sm:gap-2 items-center">
          <div className="flex items-center gap-2 relative group">
            <Button
              text-size="md"
              size="register"
              color="off"
              className="py-0.5 px-1.5 sm:py-1 sm:px-2"
            >
              <div className="flex items-center gap-1 relative group">
                <span>키보드 가이드</span>
              </div>
            </Button>

            {/* 호버 시 나타나는 가이드 */}
            <div className="absolute z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 top-full left-0 mt-2">
              <KeyboardGuide />
            </div>
          </div>
          <div className="h-6 w-[1px] bg-gray-200 mx-1" />
          <Button
            size="register"
            color="primary"
            className="py-0.5 px-1.5 sm:py-1 sm:px-2"
            onClick={onRuleClick}
          >
            규칙 설정
          </Button>
          <div className="flex items-center gap-1">
            <Button
              text-size="md"
              size="register"
              color="evening"
              className="py-0.5 px-1.5 sm:py-1 sm:px-2 flex items-center gap-2 group"
              onClick={onAutoCreate}
            >
              자동 생성
              <Tooltip
                content={
                  <div className="text-left space-y-1.5">
                    <p>근무표는 다음 조건들을 고려하여 자동으로 생성됩니다:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>주중/주말별 필요 최소 인원</li>
                      <li>근무표 규칙</li>
                      <li>개인별 근무 요청</li>
                      <li>평일 데이, 나이트 전담 근무</li>
                      <li>간호사 간 균등한 근무 배분</li>
                      <li>지난 달 말일 근무 고려</li>
                    </ul>
                    <p className="mt-2 text-gray-300">
                      *숙련도 반영은은 개발 중입니다.
                      <br />* 커스텀 규칙 생성 기능은 개발 중입니다.
                      <br />
                      *완성도 100%일 시 새로운 근무표가 생성되지 않을 수
                      있습니다.
                      <br />
                      *변경이 필요한 칸을 X로 눌러 자동생성을 재실행하는 것을
                      추천드립니다.
                    </p>
                  </div>
                }
                className="ml-1"
                width="w-96"
                icon={{
                  name: 'alert',
                  size: 16,
                  className:
                    'text-duty-evening group-hover:text-white transition-colors cursor-help',
                }}
              />
            </Button>
          </div>
          <div className="relative">
            <Button
              text-size="md"
              size="register"
              color="off"
              className={`py-0.5 px-1.5 sm:py-1 sm:px-2 ${
                isDemo || isExporting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={() =>
                !isDemo &&
                !isExporting &&
                setShowWebDownloadDropdown((prev) => !prev)
              }
            >
              <div className="flex items-center gap-1">
                다운로드
                {(isDemo || isExporting) && (
                  <Tooltip
                    content={
                      isExporting
                        ? '내보내기 중입니다...'
                        : '로그인 후 이용해주세요'
                    }
                    className="ml-1"
                    width="w-40"
                  />
                )}
              </div>
            </Button>
            {showWebDownloadDropdown && !isDemo && !isExporting && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg z-50 min-w-[8rem] py-1">
                <button
                  onClick={() => {
                    setShowWebDownloadDropdown(false);
                    onDownloadImage();
                  }}
                  className="w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                  disabled={isExporting}
                >
                  이미지로 다운로드
                </button>
                <button
                  onClick={() => {
                    setShowWebDownloadDropdown(false);
                    onDownloadExcel();
                  }}
                  className="w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                  disabled={isExporting}
                >
                  엑셀로 다운로드
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
