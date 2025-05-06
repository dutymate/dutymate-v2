import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import PageLoadingSpinner from '@/components/atoms/Loadingspinner';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { HospitalInfo } from '@/services/wardService';
import { hasCompleteKoreanChars, debounce } from '@/utils/textUtils';

interface CreateWardFormProps {
  onSubmit: (hospitalName: string, wardName: string) => Promise<void>;
  onSearchHospitals: (searchTerm: string) => Promise<void>;
  hospitals: HospitalInfo[];
  isSearching: boolean;
  initialSuccess?: boolean;
}

interface FormErrors {
  hospitalName?: string;
  wardName?: string;
}

// 드롭다운 렌더링을 위한 컴포넌트
const DropdownContent = ({
  searchable,
  searchType,
  hospitals,
  isSearching,
  hospitalName,
  selectedIndex,
  onManualSelect,
  onItemMouseEnter,
  onItemClick,
}: {
  searchable: boolean;
  searchType: 'korean' | 'english' | 'none';
  hospitals: HospitalInfo[];
  isSearching: boolean;
  hospitalName: string;
  selectedIndex: number;
  onManualSelect: () => void;
  onItemMouseEnter: (index: number) => void;
  onItemClick: (hospital: HospitalInfo) => void;
}) => {
  // 검색 불가능한 경우 - 한글 입력 중
  if (!searchable && searchType === 'korean') {
    return (
      <div className="px-[0.5rem] py-[1rem] text-center text-gray-500 text-sm">
        2글자 이상의 완성된 한글을 포함하여 검색해주세요.
      </div>
    );
  }

  // 검색 불가능한 경우 - 영어 입력 중
  if (!searchable && searchType === 'english') {
    return (
      <div className="px-[0.5rem] py-[1rem] text-center text-gray-500 text-sm">
        2글자 이상 입력해주세요.
      </div>
    );
  }

  // 검색 가능하지만 결과가 없는 경우
  if (searchable && hospitals.length === 0 && !isSearching) {
    return (
      <div className="flex flex-col px-[0.5rem] py-[0.5rem] items-center">
        <div className="text-center text-gray-500 text-sm mb-2">
          검색 결과가 없습니다.
        </div>
        <Button
          type="button"
          color="off"
          size="xs"
          onClick={onManualSelect}
          className="text-xs py-1"
        >
          "{hospitalName}" 직접 추가하기
        </Button>
      </div>
    );
  }

  // 검색 결과가 있는 경우
  return (
    <>
      {searchable &&
        hospitals.length > 0 &&
        hospitals
          .filter((hospital) =>
            hospital.hospitalName
              .toLowerCase()
              .includes(hospitalName.toLowerCase())
          )
          .map((hospital, index) => (
            <div
              key={hospital.hospitalName}
              data-dropdown-item
              className={`px-[0.5rem] py-[0.375rem] rounded-[0.25rem] cursor-pointer ${
                index === selectedIndex ? 'bg-primary-10' : ''
              } hover:bg-primary-10 active:bg-primary-10`}
              onClick={() => onItemClick(hospital)}
              onMouseEnter={() => onItemMouseEnter(index)}
            >
              <div className="flex items-center gap-[0.25rem]">
                <span className="text-sm font-medium">
                  {hospital.hospitalName}
                </span>
              </div>
              <div className="text-[0.6rem] text-gray-500 mt-[0.125rem]">
                {hospital.address}
              </div>
            </div>
          ))}
    </>
  );
};

const CreateWardForm = ({
  onSubmit,
  onSearchHospitals,
  hospitals,
  isSearching,
  initialSuccess = false,
}: CreateWardFormProps) => {
  // 폼 상태
  const [hospitalName, setHospitalName] = useState('');
  const [wardName, setWardName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(initialSuccess);
  const [errors, setErrors] = useState<FormErrors>({});

  // 드롭다운 상태
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchable, setSearchable] = useState(false);
  const [searchType, setSearchType] = useState<'korean' | 'english' | 'none'>(
    'none'
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 드롭다운에서 병원 선택 시 호출되는 핸들러
  const handleHospitalSelect = useCallback(
    (hospital: HospitalInfo) => {
      // 선택된 병원명을 입력창에 설정
      setHospitalName(hospital.hospitalName);
      // 드롭다운 닫기
      setShowDropdown(false);
      // 기존 에러 메시지 제거
      if (errors.hospitalName) {
        setErrors((prev) => ({ ...prev, hospitalName: undefined }));
      }
    },
    [errors.hospitalName]
  );

  // 직접 입력한 병원 선택 핸들러
  const handleManualHospitalSelect = useCallback(() => {
    // 드롭다운 닫기
    setShowDropdown(false);
    // 기존 에러 메시지 제거
    if (errors.hospitalName) {
      setErrors((prev) => ({ ...prev, hospitalName: undefined }));
    }
  }, [errors.hospitalName]);

  // 키보드 내비게이션 훅 사용
  const {
    selectedIndex,
    handleItemMouseEnter,
    handleDropdownMouseLeave,
    handleItemClick,
  } = useKeyboardNavigation({
    items: hospitals,
    visible: showDropdown,
    setVisible: setShowDropdown,
    onSelect: handleHospitalSelect,
    containerRef: dropdownRef,
  });

  // 디바운스 처리된 병원 검색 함수를 컴포넌트 마운트 시 한 번만 생성
  const debouncedSearchHospitals = useCallback(
    debounce(onSearchHospitals, 300),
    [onSearchHospitals]
  );

  // 드롭다운 외부 클릭 감지 이벤트 핸들러
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    // 이벤트 리스너 등록
    document.addEventListener('mousedown', handleClickOutside);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 폼 유효성 검증
  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {};

    if (!hospitalName.trim()) {
      newErrors.hospitalName = '병원명을 입력해주세요.';
    } else if (hospitalName.length < 2) {
      newErrors.hospitalName = '병원명은 2자 이상 입력해주세요.';
    } else if (hospitalName.length > 50) {
      newErrors.hospitalName = '병원명은 50자 이하로 입력해주세요.';
    }

    if (!wardName.trim()) {
      newErrors.wardName = '병동명을 입력해주세요.';
    } else if (wardName.length < 2) {
      newErrors.wardName = '병동명은 2자 이상 입력해주세요.';
    } else if (wardName.length > 20) {
      newErrors.wardName = '병동명은 20자 이하로 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [hospitalName, wardName]);

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onSubmit(hospitalName, wardName);
      setIsSuccess(true);
    } catch (error) {
      console.error('병동 생성 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 검색 가능 여부 판단 함수
  const determineSearchability = useCallback((value: string) => {
    // 입력값 길이가 2자 이상인지 확인
    const isMinLength = value.trim().length >= 2;

    // 입력값에 한글이 포함되어 있는지 확인
    const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(value);

    let shouldSearch = false;
    let type: 'korean' | 'english' | 'none' = 'none';

    if (value.trim() === '') {
      // 입력값이 없는 경우
      type = 'none';
    } else if (hasKorean) {
      // 한글 입력 시 기존 조건 적용 (완성형 한글 + 2자 이상)
      shouldSearch = isMinLength && hasCompleteKoreanChars(value.trim());
      type = 'korean';
    } else {
      // 영어 등 한글이 아닌 경우 2자 이상만 확인
      shouldSearch = isMinLength;
      type = 'english';
    }

    return { shouldSearch, type };
  }, []);

  /**
   * 병원명 입력 필드 변경 핸들러
   * - 입력값에 따라 병원 검색을 실행하고 드롭다운 표시 여부를 관리
   * - 입력값이 비어있으면 드롭다운을 숨김
   * - 한글 입력 시: 완성형 한글이 포함된 2자 이상 입력 필요
   * - 영어 입력 시: 2자 이상 입력 필요
   * - 기존 에러 메시지가 있으면 초기화
   */
  const handleHospitalNameChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    // 입력값 추출 및 병원명 상태 업데이트
    const value = e.target.value;
    setHospitalName(value);

    // 입력값이 비어있으면 드롭다운 숨김 처리
    if (value.trim() === '') {
      setShowDropdown(false);
      setSearchable(false);
      setSearchType('none');
      return;
    }

    // 기존 에러 메시지 있으면 제거
    if (errors.hospitalName) {
      setErrors((prev) => ({ ...prev, hospitalName: undefined }));
    }

    // 검색 가능 여부 판단
    const { shouldSearch, type } = determineSearchability(value);
    setSearchable(shouldSearch);
    setSearchType(type);

    // 검색 및 드롭다운 표시 결정
    if (shouldSearch) {
      // 미리 생성된 디바운스 함수 사용
      await debouncedSearchHospitals(value);
      setShowDropdown(true);
    } else {
      // 검색 조건을 충족하지 않을 때도 드롭다운 표시 (안내 메시지용)
      setShowDropdown(value.trim().length > 0);
    }
  };

  // 병동명 입력 핸들러
  const handleWardNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // 병동명 상태 업데이트
      setWardName(e.target.value);
      // 기존 에러 메시지 제거
      if (errors.wardName) {
        setErrors((prev) => ({ ...prev, wardName: undefined }));
      }
    },
    [errors.wardName]
  );

  // 병원명 입력창 포커스 시 드롭다운 표시
  const handleInputFocus = useCallback(() => {
    if (hospitalName.trim() !== '') {
      setShowDropdown(true);
    }
  }, [hospitalName]);

  // 성공 화면 렌더링
  if (isSuccess) {
    return (
      <div className="bg-white rounded-[0.925rem] shadow-[0_0_0.9375rem_rgba(0,0,0,0.1)] px-[1.5em] py-[1.5rem] w-[20rem] sm:w-[25rem] sm:px-[2rem] sm:py-[2rem] lg:px-[3rem] lg:py-[3rem] flex flex-col items-center justify-center">
        <div className="flex flex-col items-center text-center w-full">
          <h1 className="text-xl font-bold text-gray-800 mb-1">
            성공적으로 병동을 생성했습니다.
          </h1>
          <p className="text-gray-400 text-ms mb-8">
            듀티메이트와 함께 더 편리한 관리를 시작하세요!
          </p>
          <div className="w-full mt-0 lg:mt-0 -mb-0"></div>
        </div>
      </div>
    );
  }

  // 폼 화면 렌더링
  return (
    <div className="bg-white rounded-[0.925rem] shadow-[0_0_0.9375rem_rgba(0,0,0,0.1)] px-[1.5em] py-[1.5rem] w-[20rem] sm:w-[25rem] sm:px-[2rem] sm:py-[2rem] lg:px-[3rem] lg:py-[3rem] flex flex-col items-center">
      {isSearching && <PageLoadingSpinner />}
      <form
        noValidate
        onSubmit={handleSubmit}
        className="flex flex-col gap-[1.5rem] w-full"
      >
        <div className="flex flex-col gap-[1rem]">
          <div className="relative">
            <Input
              id="hospital-name"
              name="hospitalName"
              label="병원명"
              placeholder="병원명을 입력해주세요."
              value={hospitalName}
              onChange={handleHospitalNameChange}
              onFocus={handleInputFocus}
              error={errors.hospitalName}
              required
              autoComplete="off" // 자동완성 비활성화
            />
            {showDropdown && hospitalName.trim() !== '' && (
              <div
                ref={dropdownRef}
                className="absolute top-[calc(100%+0.25rem)] left-0 w-full bg-white border border-gray-200 rounded-[0.25rem] shadow-lg z-50 max-h-[7.5rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300"
                onMouseLeave={handleDropdownMouseLeave}
              >
                <DropdownContent
                  searchable={searchable}
                  searchType={searchType}
                  hospitals={hospitals}
                  isSearching={isSearching}
                  hospitalName={hospitalName}
                  selectedIndex={selectedIndex}
                  onManualSelect={handleManualHospitalSelect}
                  onItemMouseEnter={handleItemMouseEnter}
                  onItemClick={handleItemClick}
                />
              </div>
            )}
          </div>
          <Input
            id="ward-name"
            name="wardName"
            label="병동명"
            placeholder="병동명을 입력해주세요."
            value={wardName}
            onChange={handleWardNameChange}
            error={errors.wardName}
            required
            autoComplete="off" // 자동완성 비활성화
          />
        </div>
        <div className="mt-[0.75rem] sm:mt-[1rem]">
          <Button
            type="submit"
            color="primary"
            size="lg"
            fullWidth
            disabled={isLoading}
            className="h-[3rem]"
          >
            <span className="text-[0.875rem] sm:text-[1rem]">
              {isLoading ? '생성 중...' : '생성하기'}
            </span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateWardForm;
