import { toPng } from "html-to-image";
import { toast } from "react-toastify";

interface TeamShiftTableDownloadOptions {
	year: number;
	month: number;
	tableElement: HTMLElement;
	prefix?: string;
	cellSize?: {
		base: number;
		nameColumn: number;
		header: number;
	};
}

export const TeamShiftTableDownload = async ({
	year,
	month,
	tableElement,
	prefix = "듀티표",
	cellSize = {
		base: 50,
		nameColumn: 110,
		header: 70,
	},
}: TeamShiftTableDownloadOptions): Promise<boolean> => {
	try {
		// 테이블 크기 계산
		const daysInMonth = new Date(year, month, 0).getDate();
		const totalRows = tableElement.querySelectorAll("tbody tr").length;

		const virtualWidth = cellSize.nameColumn + daysInMonth * cellSize.base;
		const virtualHeight = cellSize.header + totalRows * cellSize.base;

		// 가상 테이블을 위한 스타일 오버라이드
		const virtualTableStyles = {
			table: {
				width: `${virtualWidth}px`,
				height: `${virtualHeight}px`,
				borderCollapse: "collapse",
				backgroundColor: "#FFFFFF",
				fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
			},
			"td, th": {
				border: "1px solid #E5E7EB",
				padding: "4px",
				textAlign: "center",
				fontSize: "12px",
			},
			th: {
				fontWeight: "500",
				fontSize: "11px",
				lineHeight: "1.2",
			},
			".duty-table-content": {
				width: `${virtualWidth}px !important`,
				minWidth: `${virtualWidth}px !important`,
				height: `${virtualHeight}px !important`,
			},
		};

		// 스타일 문자열 생성
		const styleString = Object.entries(virtualTableStyles)
			.map(([selector, rules]) => {
				const ruleString = Object.entries(rules)
					.map(([property, value]) => `${property}: ${value};`)
					.join(" ");
				return `${selector} { ${ruleString} }`;
			})
			.join("\n");

		// 이미지 생성 옵션
		const options = {
			quality: 1.0,
			pixelRatio: 3,
			width: virtualWidth,
			height: virtualHeight,
			style: {
				transform: "scale(1)",
				transformOrigin: "top left",
			},
			fontEmbedCSS: styleString,
			backgroundColor: "#FFFFFF",
		};

		const dataUrl = await toPng(tableElement, options);

		const link = document.createElement("a");
		link.download = `${prefix}_${year}년_${month}월.png`;
		link.href = dataUrl;
		link.click();

		toast.success("듀티표가 다운로드되었습니다.");
		return true;
	} catch (error) {
		console.error("Download error:", error);
		toast.error("듀티표 다운로드에 실패했습니다.");
		return false;
	}
};
