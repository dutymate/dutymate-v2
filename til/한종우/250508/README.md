# Today I Learned

> 2025년 05월 08일

## React Native WebView 뒤로가기

React Native WebView에서 뒤로가기 제스처를 수행할 때, 이전 페이지로 이동하도록 설정하는 방법입니다.

iOS에서는 WebView 태그 안에 `allowsBackForwardNavigationGestures`를 추가하면 됩니다.

```javascript
import React from 'react';
import { WebView } from 'react-native-webview';

const MyWebView = () => {
  return (
    <WebView
      source={{ uri: 'https://example.com' }}
      allowsBackForwardNavigationGestures={true} // 뒤로가기 제스처 허용
    />
  );
};

export default MyWebView;
```

안드로이드에서는 아래와 같이 구현할 수 있습니다.

```javascript
import React from 'react';
import React, { useEffect, useRef, useCallback } from "react";
import { BackHandler } from "react-native";

const MyWebView = () => {
  const webViewRef = useRef<WebView>(null);
	const uri = "https://example.com";
	const handleAndroidBackPress = useCallback(() => {
		if (webViewRef.current) {
			webViewRef.current.goBack();
			return true;
		}
		return false;
	}, []);

	useEffect(() => {
		BackHandler.addEventListener("hardwareBackPress", handleAndroidBackPress);
		return () => {
			BackHandler.removeEventListener(
				"hardwareBackPress",
				handleAndroidBackPress,
			);
		};
	}, [handleAndroidBackPress]);
	
	return (
        <WebView
            ref={webViewRef}
            source={{ uri }}
        />
    );
};

export default MyWebView;
```
