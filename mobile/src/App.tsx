import { StatusBar } from "expo-status-bar";

import { WebViewContainer } from "@/components/webview/WebViewContainer";

/**
 * 앱의 메인 컴포넌트입니다.
 */
export default function App() {
	return (
		<>
			<StatusBar style="auto" />
			<WebViewContainer />
		</>
	);
}
