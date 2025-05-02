# Today I Learned

> 2025년 05월 02일

React Native에서는 기본 Button 컴포넌트보다 TouchableOpacity나 Pressable을 사용하는 것이 일반적이다.
그 이유는 Button이 다음과 같은 여러 제약을 가지고 있기 때문이다.

우선 Button은 제공되는 props가 매우 제한적이다.
텍스트, 색상(color), disabled 정도만 설정할 수 있고, 스타일 커스터마이징(예: padding, borderRadius, fontSize, backgroundColor 등)이 불가능하다.
즉, 원하는 디자인을 만들기 어려워 실제 앱 디자인 요구사항을 만족시키기 힘들다.
또, iOS와 Android에서 동작하거나 렌더링되는 방식이 달라 플랫폼 간 UI 일관성 유지가 어렵다.

반면 TouchableOpacity는 기본적으로 뷰(View)처럼 작동하므로, 내부에 텍스트, 아이콘, 이미지를 자유롭게 넣을 수 있고 style도 완전히 제어할 수 있다.
또한 누를 때 투명도가 줄어드는 터치 피드백도 기본 제공되어 사용자 경험(UX) 측면에서도 좋다.

실제 프로젝트에서도 커스텀 버튼 컴포넌트를 만들 때 대부분 TouchableOpacity 또는 Pressable을 기반으로 만들어 사용한다.
이 방식은 버튼에 Tailwind나 Styled-components, 또는 일반 StyleSheet를 적용해 유연하게 대응할 수 있다는 장점이 있다.
