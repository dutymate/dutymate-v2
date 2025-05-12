import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  FaCheck,
  FaStar,
  FaRegStar,
  FaChevronRight,
  FaChevronLeft,
} from 'react-icons/fa';
import { HiX } from 'react-icons/hi';
import useUserAuthStore from '@/stores/userAuthStore';

// 설문조사 스키마 정의
const surveySchema = yup.object({
  satisfaction: yup
    .number()
    .required('만족도를 선택해주세요')
    .min(1, '만족도를 선택해주세요')
    .max(5, '만족도를 선택해주세요'),
  favoriteFeatures: yup
    .array()
    .of(yup.string())
    .min(1, '최소 하나 이상의 기능을 선택해주세요'),
  customFeature: yup.string().when('favoriteFeatures', {
    is: (features: string[]) => features.includes('기타'),
    then: (schema) => schema.required('기타 기능을 입력해주세요'),
    otherwise: (schema) => schema.optional(),
  }),
  recommendation: yup
    .number()
    .required('추천 의향을 선택해주세요')
    .min(1, '추천 의향을 선택해주세요')
    .max(5, '추천 의향을 선택해주세요'),
  feedback: yup.string().optional(),
  position: yup.string().optional(),
  experience: yup.string().optional(),
  wardSize: yup.string().optional(),
  teamSize: yup.string().optional(),
});

// 타입 정의
type SurveyFormInputs = {
  satisfaction: number;
  favoriteFeatures: string[];
  customFeature?: string;
  recommendation: number;
  feedback?: string;
  position?: string;
  experience?: string;
  wardSize?: string;
  teamSize?: string;
};

interface SurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type StepType =
  | 'satisfaction'
  | 'favoriteFeatures'
  | 'recommendation'
  | 'feedback'
  | 'userInfo';

const SurveyModal = ({ isOpen, onClose }: SurveyModalProps) => {
  const { isAuthenticated, userInfo } = useUserAuthStore();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState<StepType>('satisfaction');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 제출 프로세스 중인지 추적하는 ref
  const isSubmittingRef = useRef(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    trigger,
    formState: { errors },
  } = useForm<SurveyFormInputs>({
    resolver: yupResolver(surveySchema) as any,
    defaultValues: {
      satisfaction: 0,
      favoriteFeatures: [],
      recommendation: 0,
      feedback: '',
      position: '',
      experience: '',
      wardSize: '',
      teamSize: '',
    },
    mode: 'onChange', // 입력값이 변경될 때마다 유효성 검사
  });

  const watchFavoriteFeatures = watch('favoriteFeatures');
  const hasOtherFeature =
    Array.isArray(watchFavoriteFeatures) &&
    watchFavoriteFeatures.includes('기타');
  const watchSatisfaction = watch('satisfaction');
  const watchRecommendation = watch('recommendation');

  // 현재 단계와 전체 단계 수
  const totalSteps = 4; // 만족도, 선호 기능, 추천 의향, 피드백
  const currentStepIndex = () => {
    switch (currentStep) {
      case 'satisfaction':
        return 0;
      case 'favoriteFeatures':
        return 1;
      case 'recommendation':
        return 2;
      case 'feedback':
        return 3;
      case 'userInfo':
        return 3;
      default:
        return 0;
    }
  };

  // 다음 단계로 이동
  const goToNextStep = async () => {
    let canProceed = true;

    // 현재 단계에 따라 유효성 검사
    if (currentStep === 'satisfaction') {
      canProceed = await trigger('satisfaction');
      if (canProceed) setCurrentStep('favoriteFeatures');
    } else if (currentStep === 'favoriteFeatures') {
      canProceed = await trigger('favoriteFeatures');
      if (hasOtherFeature) {
        canProceed = canProceed && (await trigger('customFeature'));
      }
      if (canProceed) setCurrentStep('recommendation');
    } else if (currentStep === 'recommendation') {
      canProceed = await trigger('recommendation');
      if (canProceed) setCurrentStep('feedback');
    } else if (currentStep === 'feedback') {
      canProceed = true; // 피드백은 필수가 아님
      setCurrentStep('userInfo');
    } else if (currentStep === 'userInfo') {
      // 사용자 정보는 모두 선택 사항임
      handleSubmit(onSubmit)();
    }
  };

  // 이전 단계로 이동
  const goToPrevStep = () => {
    if (currentStep === 'favoriteFeatures') {
      setCurrentStep('satisfaction');
    } else if (currentStep === 'recommendation') {
      setCurrentStep('favoriteFeatures');
    } else if (currentStep === 'feedback') {
      setCurrentStep('recommendation');
    } else if (currentStep === 'userInfo') {
      setCurrentStep('feedback');
    }
  };

  const onSubmit: SubmitHandler<SurveyFormInputs> = async (data) => {
    setIsSubmitting(true);
    // 제출 프로세스 시작 표시
    isSubmittingRef.current = true;

    // 제출 시간 기록
    const submissionData = {
      ...data,
      submissionDate: new Date().toISOString(),
    };

    try {
      // Google 스프레드시트로 데이터 전송
      await sendToGoogleSheet(data);

      // 제출 성공 후 상태 업데이트
      setIsSubmitted(true);

      // 데이터 제출이 성공한 후에 로컬 스토리지에 설문 완료 정보 저장
      localStorage.setItem('survey_completed', 'true');
      localStorage.setItem('survey_completed_date', Date.now().toString());
      localStorage.setItem('survey_data', JSON.stringify(submissionData));

      // 5초 후 모달 닫기
      setTimeout(() => {
        onClose();
        // 다음 모달 열림을 위해 상태 초기화
        setCurrentStep('satisfaction');
      }, 5000);
    } catch (error) {
      console.error('설문 제출 중 오류 발생:', error);

      // 오류 발생 시에도 제출되었다고 표시 (UX 목적)
      setIsSubmitted(true);

      // 오류 발생 시에도 로컬 저장소에 설문 완료 정보 저장
      localStorage.setItem('survey_data', JSON.stringify(submissionData));
      localStorage.setItem('survey_completed', 'true');
      localStorage.setItem('survey_completed_date', Date.now().toString());

      // 5초 후 모달 닫기
      setTimeout(() => {
        onClose();
        // 다음 모달 열림을 위해 상태 초기화
        setCurrentStep('satisfaction');
      }, 5000);
    } finally {
      setIsSubmitting(false);
      // 제출 프로세스 완료 표시
      isSubmittingRef.current = false;
    }
  };

  // 구글 스프레드시트로 데이터 전송하는 함수
  const sendToGoogleSheet = async (data: SurveyFormInputs) => {
    // Google 스프레드시트 스크립트 URL
    const url =
      'https://script.google.com/macros/s/AKfycbz4qUS98ZI3b8L6HPUyHLGFnUWVwlic8RYvYsFaMi7WTvmnsTIjYFXqtUEk2BA68oNaGw/exec';

    // 폼 데이터 생성
    let formData = '';

    // 설문 응답 데이터 추가
    formData += `Satisfaction=${encodeURIComponent(data.satisfaction.toString())}`;
    formData += `&FavoriteFeatures=${encodeURIComponent(data.favoriteFeatures.join(', '))}`;
    if (data.customFeature) {
      formData += `&CustomFeature=${encodeURIComponent(data.customFeature)}`;
    }
    formData += `&Recommendation=${encodeURIComponent(data.recommendation.toString())}`;
    if (data.feedback) {
      formData += `&Feedback=${encodeURIComponent(data.feedback)}`;
    }
    if (data.position) {
      formData += `&Position=${encodeURIComponent(data.position)}`;
    }
    if (data.experience) {
      formData += `&Experience=${encodeURIComponent(data.experience)}`;
    }
    if (data.wardSize) {
      formData += `&WardSize=${encodeURIComponent(data.wardSize)}`;
    }
    if (data.teamSize) {
      formData += `&TeamSize=${encodeURIComponent(data.teamSize)}`;
    }

    // 타임스탬프 추가
    formData += `&SubmissionDate=${encodeURIComponent(new Date().toISOString())}`;

    // 로그인한 사용자 정보 추가
    if (isAuthenticated && userInfo) {
      formData += `&UserName=${encodeURIComponent(userInfo.name)}`;
      formData += `&MemberId=${encodeURIComponent(userInfo.memberId.toString())}`;
      formData += `&UserRole=${encodeURIComponent(userInfo.role)}`;
      if (userInfo.provider) {
        formData += `&Provider=${encodeURIComponent(userInfo.provider)}`;
      }
    }

    // 데이터 전송
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('데이터 전송 중 오류가 발생했습니다.');
    }

    return await response.text();
  };

  // 이미 설문에 응답했는지 확인
  const checkIfAlreadySubmitted = () => {
    // 현재 제출 프로세스 중이면 이미 제출된 것으로 간주하지 않음
    if (isSubmittingRef.current || isSubmitted) {
      return false;
    }
    return localStorage.getItem('survey_completed') === 'true';
  };

  // 모달이 열릴 때 설문 제출 여부 확인 및 현재 세션 체크
  useEffect(() => {
    if (isOpen && isSubmitted) {
      // 같은 세션에서 제출한 경우, 감사합니다 모달 표시
      setIsSubmitted(true);
    }
  }, [isOpen, isSubmitted]);

  // 모달이 닫힐 때 실행되는 핸들러
  useEffect(() => {
    if (!isOpen && isSubmitted) {
      // 모달이 닫힌 후 상태 초기화
      setTimeout(() => {
        setIsSubmitted(false);
        setCurrentStep('satisfaction');
      }, 300);
    }
  }, [isOpen, isSubmitted]);

  if (!isOpen) return null;

  // 제출 완료 화면
  const submittedContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-7 w-[85%] md:w-[380px] text-center">
        <div className="bg-green-50 rounded-full h-14 w-14 flex items-center justify-center mx-auto mb-5">
          <FaCheck className="text-green-500 text-xl" />
        </div>
        <h2 className="text-xl font-semibold mb-2 text-gray-800">
          의견을 보내주셔서 감사해요
        </h2>
        <p className="text-gray-500 mb-6 text-sm">
          더 나은 서비스를 위해 소중히 반영하겠습니다
        </p>
        <button
          onClick={onClose}
          className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium transition-all hover:bg-gray-800"
        >
          확인
        </button>
      </div>
    </div>
  );

  // 이미 제출한 경우
  const alreadySubmittedContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-7 w-[85%] md:w-[380px] text-center">
        <div className="bg-green-50 rounded-full h-14 w-14 flex items-center justify-center mx-auto mb-5">
          <FaCheck className="text-green-500 text-xl" />
        </div>
        <h2 className="text-xl font-semibold mb-2 text-gray-800">
          이미 설문에 참여했어요
        </h2>
        <p className="text-gray-500 mb-6 text-sm">소중한 의견 감사합니다</p>
        <button
          onClick={onClose}
          className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium transition-all hover:bg-gray-800"
        >
          확인
        </button>
      </div>
    </div>
  );

  // 완료 버튼을 표시할지 다음 버튼을 표시할지 결정
  const isLastStep = currentStep === 'userInfo';
  const canProceedToNext =
    (currentStep === 'satisfaction' && watchSatisfaction > 0) ||
    (currentStep === 'favoriteFeatures' &&
      watchFavoriteFeatures &&
      watchFavoriteFeatures.length > 0 &&
      (!hasOtherFeature || (hasOtherFeature && watch('customFeature')))) ||
    (currentStep === 'recommendation' && watchRecommendation > 0) ||
    currentStep === 'feedback' ||
    currentStep === 'userInfo';

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-4">
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-[90%] md:w-[420px] max-w-full">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 rounded-full p-1.5"
        >
          <HiX className="w-4 h-4" />
        </button>

        {/* 헤더 */}
        <div className="mb-3">
          <p className="text-xs text-gray-400 mb-2">
            {currentStepIndex() + 1}/{totalSteps} 설문조사
          </p>
          <h2 className="text-xl font-bold text-gray-800">
            {currentStep === 'satisfaction' && '만족도 평가'}
            {currentStep === 'favoriteFeatures' && '마음에 드는 기능'}
            {currentStep === 'recommendation' && '추천 의향'}
            {currentStep === 'feedback' && '개선 의견'}
            {currentStep === 'userInfo' && '사용자 정보 (선택)'}
          </h2>
        </div>

        {/* 프로그레스 바 */}
        <div className="mb-6">
          <div className="w-full bg-gray-100 rounded-full h-1">
            <div
              className="bg-duty-night h-1 rounded-full transition-all duration-300"
              style={{
                width: `${(currentStepIndex() / (totalSteps - 1)) * 100}%`,
              }}
            ></div>
          </div>
        </div>

        <form className="space-y-7">
          {/* 1. 자동생성된 근무표 만족도 - 별점 UI */}
          {currentStep === 'satisfaction' && (
            <div className="min-h-[200px] flex flex-col items-center">
              <p className="text-gray-700 text-center mb-10 max-w-[300px]">
                자동생성된 근무표에 얼마나 만족하시나요?
              </p>
              <div className="flex justify-center items-center">
                <Controller
                  name="satisfaction"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center space-x-3">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => field.onChange(rating)}
                          className="focus:outline-none transition-all duration-200 hover:scale-110"
                        >
                          {rating <= field.value ? (
                            <FaStar className="text-yellow-400 text-3xl" />
                          ) : (
                            <FaRegStar className="text-gray-200 text-3xl" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>

              {watchSatisfaction > 0 && (
                <div className="mt-8 text-center">
                  <span className="bg-gray-50 py-1.5 px-4 rounded-full text-sm font-medium text-gray-700">
                    {watchSatisfaction === 1 && '매우 불만족'}
                    {watchSatisfaction === 2 && '불만족'}
                    {watchSatisfaction === 3 && '보통'}
                    {watchSatisfaction === 4 && '만족'}
                    {watchSatisfaction === 5 && '매우 만족'}
                  </span>
                </div>
              )}

              {errors.satisfaction && (
                <p className="text-red-500 text-xs text-center mt-4">
                  {errors.satisfaction.message}
                </p>
              )}
            </div>
          )}

          {/* 2. 가장 만족한 기능 체크박스 */}
          {currentStep === 'favoriteFeatures' && (
            <div className="min-h-[200px]">
              <p className="text-gray-700 text-center mb-6">
                가장 마음에 드는 기능은 무엇인가요?
              </p>
              <div className="space-y-2.5 mb-2">
                {[
                  '근무표 관리 기능',
                  '교대 근무 변경 요청 기능',
                  '나의 듀티표 기능',
                  '병동 듀티표 기능',
                  '서비스 디자인',
                  '기타',
                ].map((feature) => (
                  <label
                    key={feature}
                    className={`flex items-center cursor-pointer p-3.5 text-sm transition-all rounded-xl ${
                      Array.isArray(watchFavoriteFeatures) &&
                      watchFavoriteFeatures.includes(feature)
                        ? 'bg-duty-night-bg text-duty-night'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      value={feature}
                      {...register('favoriteFeatures')}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 flex-shrink-0 rounded-md border mr-3 flex items-center justify-center ${
                        Array.isArray(watchFavoriteFeatures) &&
                        watchFavoriteFeatures.includes(feature)
                          ? 'border-duty-night bg-duty-night'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {Array.isArray(watchFavoriteFeatures) &&
                        watchFavoriteFeatures.includes(feature) && (
                          <FaCheck className="text-white text-xs" />
                        )}
                    </div>
                    <span className="flex-grow">{feature}</span>
                  </label>
                ))}
              </div>

              {hasOtherFeature && (
                <div className="mt-4">
                  <input
                    type="text"
                    {...register('customFeature')}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-duty-night text-sm placeholder-gray-400"
                    placeholder="어떤 기능이 좋았는지 작성해주세요"
                  />
                  {errors.customFeature && (
                    <p className="text-red-500 text-xs mt-2 pl-1">
                      {errors.customFeature.message}
                    </p>
                  )}
                </div>
              )}

              {errors.favoriteFeatures && (
                <p className="text-red-500 text-xs mt-2 pl-1">
                  {errors.favoriteFeatures.message}
                </p>
              )}
            </div>
          )}

          {/* 3. 추천 의향 */}
          {currentStep === 'recommendation' && (
            <div className="min-h-[200px] flex flex-col">
              <p className="text-gray-700 text-center mb-8">
                다른 간호사 동료에게 이 서비스를 추천하실 의향이 있으신가요?
              </p>
              <div className="flex-grow flex items-center">
                <Controller
                  name="recommendation"
                  control={control}
                  render={({ field }) => (
                    <div className="w-full">
                      <div className="flex justify-between mb-3">
                        <span className="text-xs text-gray-500">
                          절대 추천하지 않음
                        </span>
                        <span className="text-xs text-gray-500">
                          매우 추천함
                        </span>
                      </div>

                      <div className="relative mb-8">
                        <div className="h-1 bg-gray-200 rounded-full mb-4"></div>

                        <div className="flex justify-between absolute top-0 left-0 right-0 -mt-2.5">
                          {[1, 2, 3, 4, 5].map((value) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => field.onChange(value)}
                              className={`w-6 h-6 rounded-full flex items-center justify-center focus:outline-none transition-all
                              ${
                                field.value === value
                                  ? 'bg-duty-night text-white'
                                  : field.value > 0
                                    ? 'bg-white border-2 border-gray-200'
                                    : 'bg-white border-2 border-gray-200'
                              }`}
                            >
                              {value}
                            </button>
                          ))}
                        </div>
                      </div>

                      {watchRecommendation > 0 && (
                        <div className="text-center mt-6">
                          <span className="bg-gray-50 py-1.5 px-4 rounded-full text-sm font-medium text-gray-700">
                            {watchRecommendation === 1 &&
                              '절대 추천하지 않겠습니다'}
                            {watchRecommendation === 2 &&
                              '추천하지 않을 것 같습니다'}
                            {watchRecommendation === 3 && '보통입니다'}
                            {watchRecommendation === 4 && '추천할 것 같습니다'}
                            {watchRecommendation === 5 && '적극 추천하겠습니다'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                />
              </div>

              {errors.recommendation && (
                <p className="text-red-500 text-xs text-center mt-2">
                  {errors.recommendation.message}
                </p>
              )}
            </div>
          )}

          {/* 4. 주관식 피드백 */}
          {currentStep === 'feedback' && (
            <div className="min-h-[200px]">
              <p className="text-gray-700 text-center mb-6">
                서비스 개선을 위한 의견을 자유롭게 남겨주세요
              </p>
              <textarea
                {...register('feedback')}
                className="w-full px-4 py-3.5 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-duty-night text-sm placeholder-gray-400"
                placeholder="서비스 사용 경험, 추가 희망 기능, 개선점, 버그 등을 자유롭게 작성해주세요."
                rows={5}
              />
            </div>
          )}

          {/* 5. 사용자 정보 (선택적) */}
          {currentStep === 'userInfo' && (
            <div className="min-h-[200px]">
              <p className="text-gray-500 text-sm text-center mb-6">
                아래 정보는 선택사항입니다.
                <br />
                근무표 생성 알고리즘 개선에 활용됩니다.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 ml-1">
                    직위
                  </label>
                  <div className="relative">
                    <select
                      {...register('position')}
                      className="w-full px-4 py-3.5 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-duty-night text-sm appearance-none"
                    >
                      <option value="">선택해주세요</option>
                      <option value="평간호사">평간호사</option>
                      <option value="수간호사">수간호사</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 ml-1">
                    근무 경력
                  </label>
                  <input
                    type="text"
                    inputMode="text"
                    {...register('experience')}
                    className="w-full px-4 py-3.5 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-duty-night text-sm placeholder-gray-400"
                    placeholder="예: 3년"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 ml-1">
                    병동 규모
                  </label>
                  <div className="relative">
                    <select
                      {...register('wardSize')}
                      className="w-full px-4 py-3.5 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-duty-night text-sm appearance-none"
                    >
                      <option value="">선택해주세요</option>
                      <option value="30개 이상">병상 30개 이상</option>
                      <option value="100개 이상">병상 100개 이상</option>
                      <option value="300개 이상">병상 300개 이상</option>
                      <option value="500개 이상">병상 500개 이상</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 ml-1">
                    팀 인원
                  </label>
                  <div className="relative">
                    <select
                      {...register('teamSize')}
                      className="w-full px-4 py-3.5 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-duty-night text-sm appearance-none"
                    >
                      <option value="">선택해주세요</option>
                      <option value="5명 이하">5명 이하</option>
                      <option value="6~10명">6~10명</option>
                      <option value="11~15명">11~15명</option>
                      <option value="16~20명">16~20명</option>
                      <option value="21명 이상">21명 이상</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 버튼 */}
          <div
            className={`flex ${currentStepIndex() > 0 ? 'justify-between' : 'justify-end'} pt-2`}
          >
            {currentStepIndex() > 0 && (
              <button
                type="button"
                onClick={goToPrevStep}
                disabled={isSubmitting}
                className="text-gray-600 text-sm font-medium flex items-center transition-colors hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaChevronLeft className="text-xs mr-1.5" /> 이전
              </button>
            )}

            <button
              type="button"
              onClick={goToNextStep}
              disabled={!canProceedToNext || isSubmitting}
              className={`px-5 py-3 rounded-xl font-medium text-sm transition-all flex items-center ${
                canProceedToNext && !isSubmitting
                  ? 'bg-duty-night text-white hover:bg-duty-night-dark shadow-sm'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isLastStep ? (
                isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    제출 중...
                  </>
                ) : (
                  '제출하기'
                )
              ) : (
                <>
                  다음 <FaChevronRight className="text-xs ml-1.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // createPortal을 사용하여 모달을 body에 직접 렌더링
  return (
    <>
      {/* 제출 완료 모달이 가장 우선순위가 높음 */}
      {isSubmitted && createPortal(submittedContent, document.body)}

      {/* 이미 제출한 경우 & 현재 제출한 것이 아닐 때 */}
      {!isSubmitted &&
        checkIfAlreadySubmitted() &&
        createPortal(alreadySubmittedContent, document.body)}

      {/* 첫 설문 작성 중인 경우 */}
      {!isSubmitted &&
        !checkIfAlreadySubmitted() &&
        createPortal(modalContent, document.body)}
    </>
  );
};

export default SurveyModal;
