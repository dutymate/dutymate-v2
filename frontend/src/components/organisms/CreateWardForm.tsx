import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import PageLoadingSpinner from '@/components/atoms/Loadingspinner';
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

const CreateWardForm = ({
  onSubmit,
  onSearchHospitals,
  hospitals,
  isSearching,
  initialSuccess = false,
}: CreateWardFormProps) => {
  const [hospitalName, setHospitalName] = useState('');
  const [wardName, setWardName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(initialSuccess);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const validateForm = () => {
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
  };

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

  /**
   * 병원명 입력 필드 변경 핸들러
   * - 입력값에 따라 병원 검색을 실행하고 드롭다운 표시 여부를 관리
   * - 입력값이 비어있으면 드롭다운을 숨김
   * - 완성형 한글이 포함된 2자 이상 입력 시 검색 API 호출 (디바운싱 적용)
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
      return;
    }

    // 기존 에러 메시지 있으면 제거
    if (errors.hospitalName) {
      setErrors((prev) => ({ ...prev, hospitalName: undefined }));
    }

    // 검색 조건: 2글자 이상이고, 완성형 한글이 적어도 하나 포함된 경우
    const shouldSearch =
      value.trim().length >= 2 && hasCompleteKoreanChars(value.trim());

    // 검색 및 드롭다운 표시 결정
    if (shouldSearch) {
      // 미리 생성된 디바운스 함수 사용
      await debouncedSearchHospitals(value);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  // 드롭다운에서 병원 선택 시 호출되는 핸들러
  const handleHospitalSelect = (hospital: string) => {
    // 선택된 병원명을 입력창에 설정
    setHospitalName(hospital);
    // 드롭다운 닫기
    setShowDropdown(false);
    // 기존 에러 메시지 제거
    if (errors.hospitalName) {
      setErrors((prev) => ({ ...prev, hospitalName: undefined }));
    }
  };

  // 병동명 입력 핸들러
  const handleWardNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 병동명 상태 업데이트
    setWardName(e.target.value);
    // 기존 에러 메시지 제거
    if (errors.wardName) {
      setErrors((prev) => ({ ...prev, wardName: undefined }));
    }
  };

  // 병원명 입력창 포커스 시 드롭다운 표시
  const handleInputFocus = () => {
    setShowDropdown(true);
  };

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
            />
            {showDropdown && hospitalName.trim() !== '' && (
              <div
                ref={dropdownRef}
                className="absolute top-[calc(100%+0.25rem)] left-0 w-full bg-white border border-gray-200 rounded-[0.25rem] shadow-lg z-50 max-h-[7.5rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300"
              >
                {hospitals
                  .filter((hospital) =>
                    hospital.hospitalName
                      .toLowerCase()
                      .includes(hospitalName.toLowerCase())
                  )
                  .map((hospital) => (
                    <div
                      key={hospital.hospitalName}
                      className="px-[0.5rem] py-[0.375rem] rounded-[0.25rem] cursor-pointer hover:bg-primary-10 active:bg-primary-10"
                      onClick={() =>
                        handleHospitalSelect(hospital.hospitalName)
                      }
                      // 아래는 다양한 사용자 환경(마우스, 터치 등)에서 일관된 UI 효과를 제공하기 위한 이벤트 핸들러들
                      // 마우스 호버 시 배경색 변경
                      onMouseEnter={(e) =>
                        e.currentTarget.classList.add('bg-primary-10')
                      }
                      // 마우스가 벗어날 때 배경색 원복
                      onMouseLeave={(e) =>
                        e.currentTarget.classList.remove('bg-primary-10')
                      }
                      // 터치 시작 시 배경색 변경 (모바일 대응)
                      onTouchStart={(e) =>
                        e.currentTarget.classList.add('bg-primary-10')
                      }
                      // 터치 이동 시 배경색 유지 (모바일 대응)
                      onTouchMove={(e) =>
                        e.currentTarget.classList.add('bg-primary-10')
                      }
                      // 터치 종료 시 배경색 원복 (모바일 대응)
                      onTouchEnd={(e) =>
                        e.currentTarget.classList.remove('bg-primary-10')
                      }
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
