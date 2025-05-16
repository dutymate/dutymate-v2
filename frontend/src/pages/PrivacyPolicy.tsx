//개인 정보 처리 방침
import { IoMdMenu } from 'react-icons/io';
import { useState } from 'react';

import MSidebar from '@/components/organisms/MSidebar';
import Sidebar from '@/components/organisms/WSidebar';
import Title from '@/components/atoms/Title';
import { SEO } from '@/components/SEO';
import useUserAuthStore from '@/stores/userAuthStore';

const PrivacyPolicy = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { userInfo } = useUserAuthStore();
  const isDemo = userInfo?.isDemo;

  return (
    <>
      <SEO
        title="개인정보 처리방침 | Dutymate"
        description="Dutymate의 개인정보 처리방침을 확인해보세요."
      />

      <div className="w-full h-screen flex flex-row bg-[#F9F9F9]">
        {/* 데스크탑 사이드바 */}
        <div className="hidden lg:block w-[14.875rem] shrink-0">
          <Sidebar
            userType={userInfo?.role as 'HN' | 'RN'}
            isDemo={isDemo ?? false}
          />
        </div>

        {/* 모바일 사이드바 */}
        <MSidebar
          userType={userInfo?.role as 'HN' | 'RN'}
          isOpen={isSidebarOpen}
          isDemo={isDemo ?? false}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* 메인 컨텐츠 */}
        <div className="flex-1 min-w-0 px-0 py-0 lg:px-10 lg:py-8 h-screen overflow-y-auto">
          {/* 모바일 헤더 */}
          <div className="flex items-center gap-4 lg:hidden mb-4 px-4 pt-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <IoMdMenu className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold">개인정보 처리방침</h1>
              <p className="text-sm text-gray-500">
                Dutymate의 개인정보 처리방침을 안내드립니다.
              </p>
            </div>
          </div>

          {/* 데스크탑 타이틀 */}
          <div className="hidden lg:flex items-center mb-8 w-full">
            <Title
              title="개인정보 처리방침"
              subtitle="Dutymate의 개인정보 처리방침을 안내드립니다."
            />
            <div className="flex-1 h-[1.5px] bg-gray-200 ml-4" />
          </div>

          {/* 본문 내용 */}
          <div className="bg-white rounded-2xl shadow-sm px-5 sm:px-8 py-6 w-full max-w-[50rem] text-sm leading-relaxed text-gray-700 text-left lg:mx-0 lg:ml-0 lg:mr-auto mt-3 mb-10">
            <h1 className="text-lg sm:text-md font-bold mb-2">
              개인정보 처리방침
            </h1>
            <hr className="mb-4 border-gray-200" />
            <section className="mb-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
                1. 총칙
              </h2>
              <hr className="my-4 border-gray-100" />
              <p className="mb-4 leading-relaxed">
                듀티메이트(이하 "회사"라 합니다)는 이용자의 개인정보를 중요하게
                여기며, 관련 법령을 준수하여 안전하게 보호하고 있습니다. 본
                개인정보 처리방침은 회사가 운영하는 서비스에서 이용자의
                개인정보를 수집, 이용, 보관, 보호하는 방법을 설명합니다.
              </p>
            </section>
            <section className="mb-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
                2. 수집하는 개인정보 항목 및 수집 방법
              </h2>
              <hr className="my-4 border-gray-100" />
              <h3 className="text-sm sm:text-base font-semibold mb-1 mt-3">
                2.1 수집하는 개인정보 항목
              </h3>
              <p className="mb-1">
                회사는 다음과 같은 개인정보를 수집할 수 있습니다.
              </p>
              <ul className="list-disc pl-5 mb-2">
                <li>
                  <b>필수 정보</b>: 이메일, 비밀번호, 이름, 연차, 성별, 직위
                </li>
                <li>
                  <b>선택 정보</b>: 프로필 사진
                </li>
                <li>
                  <b>자동 수집 정보</b>: 서비스 이용 기록, 접속 로그, 쿠키, 기기
                  정보
                </li>
              </ul>
              <h3 className="text-sm sm:text-base font-semibold mb-1 mt-3">
                2.2 개인정보 수집 방법
              </h3>
              <ul className="list-disc pl-5 mb-3">
                <li>서비스 가입 및 이용 과정에서 이용자가 직접 입력</li>
                <li>자동화된 기술을 통한 수집 (쿠키 및 로그 분석 도구 활용)</li>
              </ul>
            </section>
            <section className="mb-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
                3. 개인정보의 이용 목적
              </h2>
              <hr className="my-4 border-gray-100" />
              <ul className="list-disc pl-5 mb-3">
                <li>회원 가입 및 관리</li>
                <li>서비스 제공 및 운영</li>
                <li>고객 문의 응대 및 기술 지원</li>
                <li>서비스 개선 및 맞춤형 콘텐츠 제공</li>
                <li>법적 의무 준수 및 보안 강화</li>
              </ul>
            </section>
            <section className="mb-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
                4. 개인정보의 보유 및 이용 기간
              </h2>
              <hr className="my-4 border-gray-100" />
              <p className="mb-1">
                회사는 이용자의 개인정보를 수집 및 이용 목적이 달성된 후 지체
                없이 파기합니다. 단, 관련 법령에 따라 보존해야 하는 경우 일정
                기간 동안 보관할 수 있습니다.
              </p>
              <ul className="list-disc pl-5 mb-3">
                <li>소비자 불만 및 분쟁 처리 기록: 3년 (전자상거래법)</li>
                <li>로그 기록 및 접속 기록: 3개월 (통신비밀보호법)</li>
              </ul>
            </section>
            <section className="mb-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
                5. 개인정보의 제3자 제공
              </h2>
              <hr className="my-4 border-gray-100" />
              <p className="mb-1">
                회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.
                다만, 아래의 경우에는 예외로 합니다.
              </p>
              <ul className="list-disc pl-5 mb-3">
                <li>이용자가 사전에 동의한 경우</li>
                <li>법령에 의해 요구되는 경우</li>
                <li>
                  서비스 제공을 위해 필요한 최소한의 정보 제공이 필요한 경우
                  (예: 결제 대행사, 클라우드 서비스 제공업체 등)
                </li>
              </ul>
            </section>
            <section className="mb-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
                6. 개인정보의 처리 위탁
              </h2>
              <hr className="my-4 border-gray-100" />
              <p className="mb-1">
                회사는 원활한 서비스 운영을 위해 일부 개인정보 처리를 외부에
                위탁할 수 있습니다. 위탁 업체와 위탁하는 업무 내용은 아래와
                같습니다.
              </p>
              <ul className="list-disc pl-5 mb-3">
                <li>
                  <b>AWS (Amazon Web Services)</b>: 클라우드 서버 운영 및 데이터
                  보관
                </li>
              </ul>
              <p className="mb-3">
                회사는 위탁 계약 시 개인정보 보호를 위한 기술적·관리적 조치를
                마련하고 있습니다.
              </p>
            </section>
            <section className="mb-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
                7. 이용자의 권리 및 행사 방법
              </h2>
              <hr className="my-4 border-gray-100" />
              <p className="mb-3">
                이용자는 언제든지 본인의 개인정보를 조회하거나 수정할 수 있으며,
                삭제 및 처리 정지를 요청할 수 있습니다. 이를 위해 서비스 내 설정
                메뉴 또는 고객센터를 통해 요청할 수 있습니다.
              </p>
            </section>
            <section className="mb-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
                8. 개인정보 보호를 위한 조치
              </h2>
              <hr className="my-4 border-gray-100" />
              <ul className="list-disc pl-5 mb-3">
                <li>
                  <b>기술적 보호 조치</b>: 암호화 저장, 방화벽 및 침입 탐지
                  시스템 운영
                </li>
                <li>
                  <b>관리적 보호 조치</b>: 개인정보 접근 권한 제한, 정기적인
                  보안 교육 실시
                </li>
                <li>
                  <b>물리적 보호 조치</b>: 서버 및 데이터센터 접근 통제
                </li>
              </ul>
            </section>
            <section className="mb-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
                9. 개인정보 보호 책임자 및 연락처
              </h2>
              <hr className="my-4 border-gray-100" />
              <p className="mb-1">
                회사는 이용자의 개인정보 보호를 위해 책임자를 지정하고 있으며,
                개인정보 보호와 관련한 문의사항은 아래 연락처를 통해 접수할 수
                있습니다.
              </p>
              <ul className="list-disc pl-5 mb-3">
                <li>
                  <b>개인정보 보호 책임자</b>: 한종우
                </li>
                <li>
                  <b>이메일</b>: jongwooo.han@gmail.com
                </li>
                <li>
                  <b>연락처</b>: 010-8610-8485
                </li>
              </ul>
            </section>
            <section className="mb-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
                10. 개정 및 공지
              </h2>
              <hr className="my-4 border-gray-100" />
              <p className="mb-1">
                본 개인정보 처리방침은 관련 법령 및 내부 정책에 따라 변경될 수
                있으며, 변경 사항은 서비스 내 공지사항을 통해 사전에
                안내드립니다.
              </p>
              <hr className="my-4 border-gray-100" />
              <p className="text-gray-400 text-xs text-right">
                시행일: 2025-01-02
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;
