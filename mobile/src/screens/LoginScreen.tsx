import { Card } from "@/components/card/Card";
import { LoginForm } from "@/components/form/login/LoginForm";
import { Layout } from "@/layout/Layout";
import { LogoTemplate } from "@/templates/LogoTemplate";

/**
 * LoginScreenProps는 LoginScreen의 props 타입을 정의합니다.
 * navigation은 React Navigation의 navigation 객체입니다.
 */
interface LoginScreenProps {
	navigation: any;
}

/**
 * LoginScreen은 로그인 화면입니다.
 * @param navigation
 */
export const LoginScreen = ({ navigation }: LoginScreenProps) => {
	return (
		<Layout>
			<LogoTemplate navigation={navigation}>
				<Card>
					<LoginForm navigation={navigation} />
					{/*<LoginEmailVerificationForm navigation={navigation} />*/}
				</Card>
			</LogoTemplate>
		</Layout>
	);
};
