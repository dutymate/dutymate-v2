import * as SecureStore from "expo-secure-store";

import React, { useEffect } from "react";

import { Card } from "@/components/common/Card";
import { LoginForm } from "@/components/login/LoginForm";
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
	// 로그인 페이지 진입 시 토큰과 사용자 정보 삭제
	useEffect(() => {
		const clearAuthData = async () => {
			try {
				await SecureStore.deleteItemAsync("auth-token");
				await SecureStore.deleteItemAsync("user-info");
			} catch (error) {
				console.error("인증 정보 삭제 중 오류 발생:", error);
			}
		};

		clearAuthData();
	}, []);

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
