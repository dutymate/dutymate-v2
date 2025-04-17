import type { SVGProps } from "react";
const SvgFaultDotIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 12 12"
		{...props}
	>
		<g clipPath="url(#fault_dot_icon_svg__a)">
			<circle cx={6} cy={6} r={3} fill="red" />
		</g>
		<defs>
			<clipPath id="fault_dot_icon_svg__a">
				<path fill="#fff" d="M0 0h12v12H0z" />
			</clipPath>
		</defs>
	</svg>
);
export default SvgFaultDotIcon;
