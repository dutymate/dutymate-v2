import LandingTemplate from "../components/templates/LandingTemplate";
import SignupForm from "../components/organisms/SignupForm";
import { SEO } from "../components/SEO";
const Signup = () => {
	return (
		<>
			<SEO
				title="회원가입 | Dutymate"
				description="듀티메이트의 회원가입 페이지입니다."
			/>
			<LandingTemplate showIntroText={false}>
				<SignupForm />
			</LandingTemplate>
		</>
	);
};

export default Signup;
