import { Card } from "@/components/card/Card";
import { PasswordResetForm } from "@/components/form/password/PasswordResetForm";
import { Layout } from "@/layout/Layout";
import { LogoTemplate } from "@/templates/LogoTemplate";

/**
 * LoginEmailVerificationFormProps는 LoginEmailVerificationForm 컴포넌트의 props 타입을 정의합니다.
 * navigation은 React Navigation의 navigation 객체입니다.
 */
interface PasswordResetScreenProps {
	navigation: any;
}

/**
 * PasswordResetScreen은 비밀번호 재설정 화면입니다.
 * @param navigation
 */
export const PasswordResetScreen = ({
	navigation,
}: PasswordResetScreenProps) => {
	return (
		<Layout>
			<LogoTemplate navigation={navigation}>
				<Card>
					<PasswordResetForm navigation={navigation} />
				</Card>
			</LogoTemplate>
		</Layout>
	);
};
