import { View } from "react-native";
import { useState } from "react";

import { DropdownComponent } from "@/components/dropdown/Dropdown";
import { Layout } from "@/layout/Layout";
import { LogoTemplate } from "@/templates/LogoTemplate";
import { StyledText } from "@/components/custom/StyledText";

const data = [
	{ label: '옵션 1', value: '1' },
	{ label: '옵션 2', value: '2' },
];

export const TestScreen = () => {
	const [selectedValue, setSelectedValue] = useState<string | null>(null);

	const handleChange = (value: string) => {
		setSelectedValue(value);
	};
	
	return (
		<Layout>
			<LogoTemplate>
				<View>
                    <StyledText>
                        간호사 연차
                    </StyledText>
					<DropdownComponent
						label="연차를 선택해주세요."
						data={data}
						value={selectedValue}
						onChange={handleChange}
                        required
					/>
				</View>
			</LogoTemplate>
		</Layout>
	);
};

