interface TitleProps {
	title: string;
	subtitle: string;
	className?: string;
}

const Title = ({ title, subtitle, className }: TitleProps) => {
	return (
		<div className={`flex items-center w-full ${className || ""}`}>
			<div className="flex items-center flex-shrink-0">
				<h1 className="text-[1rem] lg:text-[1.25rem] font-semibold whitespace-nowrap">
					{title}
				</h1>
				{subtitle && (
					<p className="text-[0.75rem] lg:text-[0.875rem] text-gray-500 ml-[0.5rem] whitespace-nowrap">
						{subtitle}
					</p>
				)}
			</div>
			<div className="flex-1 border-b border-gray-300 ml-[1rem]"></div>
		</div>
	);
};

export default Title;
