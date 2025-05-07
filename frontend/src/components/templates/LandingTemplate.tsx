import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface LandingTemplateProps {
  children?: React.ReactNode;
  showIntroText?: boolean;
}

const LandingTemplate: React.FC<LandingTemplateProps> = ({
  children,
  showIntroText = false,
}) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024); // 1024px is the 'lg' breakpoint in Tailwind
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleLogoClick = () => {
    navigate('/');
  };

  const renderContent = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-[1rem] py-[0.75rem]">
      <img
        src="/images/logo.svg"
        alt="DutyMate Logo"
        className="w-[50%] max-w-[15rem] mb-[1.5rem] cursor-pointer"
        onClick={handleLogoClick}
      />
      {showIntroText && (
        <div className="text-center mb-[1.5rem]">
          <h1 className="text-[1.25rem] font-bold text-gray-800 mb-[0.375rem]">
            "듀티표의 마침표, 듀티메이트."
          </h1>
          <p className="text-[0.875rem] text-gray-600">
            간호사 업무의 효율성과 공정성을 높이는
            <br />
            자동화 듀티표 생성 서비스.
          </p>
        </div>
      )}
      {children}
    </div>
  );

  return (
    <div className="w-full h-screen bg-base-muted-30 animate-wave-bg">
      <div className="w-full h-screen flex flex-col lg:flex-row">
        {/* 모바일 레이아웃 */}
        {isMobile && (
          <div className="flex flex-col h-screen overflow-hidden">
            {renderContent()}
          </div>
        )}

        {/* 데스크톱 레이아웃 */}
        {!isMobile && (
          <>
            <div className="flex-1 flex items-center">
              <div className="relative w-full h-full">
                <div className="absolute inset-0 flex flex-col items-center justify-center px-[8%]">
                  <div className="slide-container">
                    <div className="slide-item">
                      <img
                        src="/images/phone.png"
                        alt="Phone Preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="slide-item">
                      <img
                        src="/images/samsung.svg"
                        alt="Notebook Preview"
                        className="w-[100%] h-[100%] object-contain transform scale-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 데스크톱 오른쪽 영역 */}
            <div className="flex-1 flex items-center">{renderContent()}</div>
          </>
        )}
      </div>
    </div>
  );
};

export default LandingTemplate;
