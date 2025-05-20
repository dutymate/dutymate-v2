import PasswordResetForm from '@/components/organisms/PasswordResetForm';
import { SEO } from '@/components/SEO';
import LandingTemplate from '@/components/templates/LandingTemplate';
import Footer from '@/components/organisms/Footer';

const PasswordReset = () => {
  return (
    <>
      <SEO
        title="비밀번호 재설정 | Dutymate"
        description="듀티메이트의 비밀번호 재설정 페이지입니다."
      />
      <div className="min-h-screen flex flex-col">
        <LandingTemplate showIntroText={false}>
          <PasswordResetForm />
        </LandingTemplate>
        <div className="mt-auto">
          <Footer />
        </div>
      </div>
    </>
  );
};

export default PasswordReset;
