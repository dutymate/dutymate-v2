import { Image, ImageStyle, StyleProp } from "react-native";

/**
 * CustomImageProps는 CustomImage 컴포넌트의 props 타입을 정의합니다.
 */
interface CustomImageProps {
	src: any;
	className?: string;
	style?: StyleProp<ImageStyle>;
}

/**
 * CustomImage 컴포넌트는 이미지 소스를 받아 이미지를 렌더링합니다.
 * @param src
 * @param className
 * @param style
 */
export const CustomImage = ({ src, className, style }: CustomImageProps) => {
	return <Image source={src} className={className} style={style} />;
};
