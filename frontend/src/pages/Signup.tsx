import SignupForm from '@/components/organisms/SignupForm';
import { SEO } from '@/components/SEO';
import LandingTemplate from '@/components/templates/LandingTemplate';
import Footer from '@/components/organisms/Footer';

const Signup = () => {
  return (
    <>
      <SEO
        title="회원가입 | Dutymate"
        description="듀티메이트의 회원가입 페이지입니다."
      />
      <div className="min-h-screen flex flex-col">
        <LandingTemplate showIntroText={false}>
          <SignupForm />
        </LandingTemplate>
        <div className="mt-auto">
          <Footer />
        </div>
      </div>
    </>
  );
};

export default Signup;
