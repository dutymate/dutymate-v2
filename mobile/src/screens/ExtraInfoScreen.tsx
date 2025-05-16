import { View } from "react-native";

import { Card } from "@/components/card/Card";
import { ExtraInfoForm } from "@/components/form/extraInfo/ExtraInfoForm";
import { Layout } from "@/layout/Layout";
import { LogoTemplate } from "@/templates/LogoTemplate";

/**
 * ExtraInfoScreenProps는 ExtraInfoScreen 컴포넌트의 props 타입을 정의합니다.
 * navigation은 React Navigation의 navigation 객체입니다.
 */
interface ExtraInfoScreenProps {
	navigation: any;
}

/**
 * ExtraInfoScreen 컴포넌트는 사용자의 추가 정보를 입력받는 화면을 렌더링합니다.
 * @param param0
 * @returns
 */
export const ExtraInfoScreen = ({ navigation }: ExtraInfoScreenProps) => {
	return (
		<Layout>
			<LogoTemplate navigation={navigation}>
				<View>
					<Card>
						<ExtraInfoForm />
					</Card>
				</View>
			</LogoTemplate>
		</Layout>
	);
};
