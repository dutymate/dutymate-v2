import { View } from "react-native";
import { Input } from "@/components/common/Input";
import { StyledText } from "@/components/common/StyledText";
import { Button } from "@/components/common/Button";

/**
 * CreateWardFormProps는 CreateWardForm 컴포넌트의 props 타입을 정의합니다.
 * navigation은 React Navigation의 navigation 객체입니다.
 */
interface CreateWardFormProps {
	navigation: any;
}

/**
 * CreateWardForm 컴포넌트는 병동 생성 폼입니다.
 * @param props
 */
export const CreateWardForm = ({ navigation }: CreateWardFormProps) => {
	return (
		<View className={"lg:block"}>
			<View className={"space-y-[0.375rem] sm:space-y-[0.5rem]"}>
				<View className={"mb-[0.5rem] gap-y-4"}>
					<Input
						label={"병원명"}
						placeholder={"병원명을 입력해주세요."}
						value={""}
						onChangeText={() => {}}
						keyboardType={"default"}
					/>
					<Input
						label={"병동명"}
						placeholder={"병동명을 입력해주세요."}
						value={""}
						onChangeText={() => {}}
						keyboardType={"default"}
					/>
					<Button
						size={"lg"}
						width={"long"}
						color={"tertiary"}
						className={
							"w-full h-[3rem] bg-primary active:bg-primary-dark mt-[1rem]"
						}
						onPress={() => navigation.navigate("WebView")}
					>
						<StyledText className={"text-white font-semibold text-lg"}>
							생성하기
						</StyledText>
					</Button>
				</View>
			</View>
		</View>
	);
};
