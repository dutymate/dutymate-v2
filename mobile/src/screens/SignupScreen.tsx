import { Card } from "@/components/card/Card";
import { SignupForm } from "@/components/form/signup/SignupForm";
import { Layout } from "@/layout/Layout";
import { LogoTemplate } from "@/templates/LogoTemplate";

/**
 * SignupScreenProps는 SignupScreen의 props 타입을 정의합니다.
 * navigation은 React Navigation의 navigation 객체입니다.
 */
interface SignupScreenProps {
	navigation: any;
}

/**
 * SignupScreen은 회원가입 화면입니다.
 * @param navigation
 */
export const SignupScreen = ({ navigation }: SignupScreenProps) => {
	return (
		<Layout>
			<LogoTemplate navigation={navigation}>
				<Card>
					<SignupForm navigation={navigation} />
				</Card>
			</LogoTemplate>
		</Layout>
	);
};
