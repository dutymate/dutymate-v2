import { Card } from "@/components/common/Card";
import { CreateWardForm } from "@/components/createWard/CreateWardForm";
import { Layout } from "@/layout/Layout";
import { LogoTemplate } from "@/templates/LogoTemplate";

/**
 * CreateWardScreenProps는 CreateWardScreen의 props 타입을 정의합니다.
 * navigation은 React Navigation의 navigation 객체입니다.
 */
interface CreateWardScreenProps {
	navigation: any;
}

/**
 * CreateWardScreen은 병동 생성 화면입니다.
 * @param navigation
 */
export const CreateWardScreen = ({ navigation }: CreateWardScreenProps) => {
	return (
		<Layout>
			<LogoTemplate navigation={navigation}>
				<Card>
					<CreateWardForm navigation={navigation} />
				</Card>
			</LogoTemplate>
		</Layout>
	);
};
