import { useEffect, useState } from 'react';
import { FaCheckCircle, FaRegStar } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';

import SubscriptionSuccessModal from '@/components/organisms/SubscriptionSuccessModal';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: (plan: 'monthly' | 'quarterly' | 'yearly') => void;
}

const PaymentModal = ({ isOpen, onClose, onSubscribe }: PaymentModalProps) => {
  const [selectedPlan, setSelectedPlan] = useState<
    'monthly' | 'quarterly' | 'yearly' | null
  >(null);
  const [autoGenCnt] = useState(100); // 기본값 설정
  const [isMobile, setIsMobile] = useState(false);

  // 모바일 여부 확인
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  if (!isOpen) return null;

  const handleSubscribe = (planType: 'monthly' | 'quarterly' | 'yearly') => {
    setSelectedPlan(planType);
    onSubscribe(planType);
  };

  const handleCompleteModalClose = () => {
    setSelectedPlan(null);
    onClose();
  };

  const handleConfirm = () => {
    if (selectedPlan) {
      handleCompleteModalClose();
    }
  };

  const plans = [
    {
      type: 'monthly',
      title: '매월 구독',
      beforePrice: '4,900',
      price: '2,900',
      period: '원',
      billingText: '매월 청구',
      buttonText: '1개월 구독 시작하기',
      features: ['자동 생성 10회/월', '병동 당 간호사 최대 10명', '광고 제거'],
      popular: false,
    },
    {
      type: 'quarterly',
      title: '분기별 구독',
      beforePrice: '12,900',
      price: '6,900',
      period: '원',
      billingText: '3개월마다 청구',
      buttonText: '3개월 구독 시작하기',
      features: ['자동 생성 20회/월', '병동 당 간호사 최대 15명', '광고 제거'],
      popular: true,
    },
    {
      type: 'yearly',
      title: '연간 구독',
      beforePrice: '49,000',
      price: '24,900',
      period: '원',
      billingText: '연간 청구',
      buttonText: '1년 구독 시작하기',
      features: ['자동 생성 무제한', '병동 당 간호사 무제한', '광고 제거'],
      popular: false,
    },
  ];

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-4 md:py-8"
        onClick={undefined} // ✨ 오버레이 클릭 막기
      >
        <div
          className="relative bg-base-white rounded-[1.25rem] shadow-lg p-4 md:p-8 w-[95%] md:w-[90%] max-w-[60rem]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <button
              onClick={onClose}
              id="close-payment-modal-button"
              className="absolute top-4 md:top-6 right-4 md:right-6 text-base-foreground hover:text-primary-dark transition-colors"
              style={{ fontSize: '1.75rem' }}
            >
              <IoMdClose />
            </button>
          </div>

          {/* 헤더 - 모바일에서는 더 간결하게 */}
          <div className="flex flex-col items-center justify-center text-center mb-6 md:mb-10">
            <div className="inline-flex items-center gap-2 bg-primary-10 text-primary-dark px-4 py-1 rounded-full mb-2 md:mb-3">
              <FaRegStar className="text-primary" />
              <span className="font-medium">얼리버드 특별 혜택</span>
            </div>
            <div className="text-xl md:text-2xl font-bold text-base-foreground mb-2">
              지금 구독하면{' '}
              <span className="text-primary-dark">
                자동 생성 기능 1개월 무료
              </span>
            </div>
            {!isMobile && (
              <div className="text-center text-base-foreground/80 max-w-2xl">
                초기 구독자에게만 제공되는 특별 혜택으로, 병동 단위 결제로
                간호사 전원이 이용할 수 있습니다.
                <span className="block mt-1 text-sm">
                  * 정식 출시 후에는 혜택이 제공되지 않습니다.
                </span>
              </div>
            )}
          </div>

          {/* 데스크탑 뷰 - 3개 카드 그리드 */}
          {!isMobile && (
            <div className="hidden md:grid grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.type}
                  className={`group relative rounded-[1.25rem] shadow-lg transform transition-all duration-300
										${
                      plan.popular
                        ? 'bg-primary-10 text-base-foreground border-2 border-primary'
                        : 'bg-base-muted-30 text-base-foreground border-2 border-transparent'
                    } 
										hover:shadow-xl hover:scale-[1.02]`}
                >
                  {plan.popular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary text-white px-2 py-0.5 rounded-md text-xs font-medium">
                      인기 선택
                    </div>
                  )}
                  <div className="p-6">
                    <div className="text-lg text-center font-bold mb-3">
                      {plan.title}
                    </div>
                    <div className="flex flex-col items-center mb-2">
                      <div className="text-sm mb-1 line-through text-base-foreground/60">
                        {plan.beforePrice}
                        <span className="ml-0.5">{plan.period}</span>
                      </div>
                      <div className="flex items-end gap-1">
                        <span
                          className={`text-3xl font-bold ${plan.type === 'quarterly' ? 'text-primary-dark' : 'text-base-foreground'}`}
                        >
                          {plan.price}
                        </span>
                        <span className="text-base mb-1 font-medium">
                          {plan.period}
                        </span>
                      </div>
                      <div className="text-xs text-base-foreground/70 mt-1">
                        {plan.billingText}
                      </div>
                    </div>
                  </div>

                  <div className="px-6 mb-6">
                    <button
                      className={`w-full py-2.5 rounded-lg text-center font-medium text-sm
												${
                          plan.popular
                            ? 'bg-primary text-white hover:bg-primary-dark'
                            : 'bg-[#666666] text-white group-hover:bg-primary group-hover:text-white hover:bg-primary-dark'
                        } 
												transition-colors duration-300`}
                      onClick={() =>
                        handleSubscribe(
                          plan.type as 'monthly' | 'quarterly' | 'yearly'
                        )
                      }
                    >
                      {plan.buttonText}
                    </button>
                  </div>

                  <div className="px-6 pb-5">
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 py-2 border-b border-base-muted/30"
                        >
                          <FaCheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 모바일 뷰 - 세로로 3개 직사각형 카드 배치 */}
          {isMobile && (
            <div className="flex flex-col gap-4 md:hidden">
              {plans.map((plan) => (
                <div
                  key={plan.type}
                  className={`relative rounded-[1rem] shadow-md
										${
                      plan.popular
                        ? 'bg-primary-10 text-base-foreground border-2 border-primary'
                        : 'bg-base-muted-30 text-base-foreground border border-transparent'
                    }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary text-white px-2 py-0.5 rounded-md text-xs font-medium">
                      인기 선택
                    </div>
                  )}

                  <div className="flex flex-row">
                    {/* 왼쪽: 타이틀과 혜택 */}
                    <div className="flex-1 p-3">
                      <div className="font-bold text-base mb-2">
                        {plan.title}
                      </div>

                      <ul className="space-y-1">
                        {plan.features.map((feature, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-1 text-xs"
                          >
                            <FaCheckCircle className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 오른쪽: 가격과 구독 버튼 */}
                    <div className="w-[120px] p-3 flex flex-col justify-between">
                      <div className="text-right mb-2">
                        <div className="text-xs line-through text-base-foreground/60">
                          {plan.beforePrice}
                          <span className="ml-0.5">{plan.period}</span>
                        </div>

                        <div className="flex items-end gap-0.5 justify-end">
                          <span
                            className={`text-xl font-bold ${plan.type === 'quarterly' ? 'text-primary-dark' : 'text-base-foreground'}`}
                          >
                            {plan.price}
                          </span>
                          <span className="text-sm font-medium">
                            {plan.period}
                          </span>
                        </div>

                        <div className="text-xs text-base-foreground/70">
                          {plan.billingText}
                        </div>
                      </div>

                      <button
                        className={`w-full h-10 rounded-lg text-center font-medium text-xs
													${
                            plan.popular
                              ? 'bg-primary text-white'
                              : 'bg-[#666666] text-white'
                          }`}
                        onClick={() =>
                          handleSubscribe(
                            plan.type as 'monthly' | 'quarterly' | 'yearly'
                          )
                        }
                      >
                        구독하기
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* 모바일에서만 보이는 간결한 설명 */}
              <div className="text-center text-sm text-base-foreground/80 mt-2">
                병동 단위 결제로 간호사 전원이 이용 가능합니다.
                <span className="block mt-1 text-xs">
                  * 정식 출시 후에는 혜택이 제공되지 않습니다.
                </span>
              </div>
            </div>
          )}

          <div className="mt-4 md:mt-8 text-center text-sm text-base-foreground/60">
            구독은 언제든지 취소할 수 있으며, 구독 기간 동안 모든 기능을
            이용하실 수 있습니다.
          </div>
        </div>
      </div>

      {/* 성공 모달 */}
      <SubscriptionSuccessModal
        isOpen={selectedPlan !== null}
        onClose={handleCompleteModalClose}
        onConfirm={handleConfirm}
        plan={selectedPlan || 'monthly'}
        autoGenCnt={autoGenCnt}
      />
    </>
  );
};

export default PaymentModal;
