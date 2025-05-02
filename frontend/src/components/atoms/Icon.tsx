import {
	AiFillHeart,
	AiFillSchedule,
	AiOutlineEye,
	AiOutlineHeart,
	AiOutlineIdcard,
	AiOutlineMessage,
} from "react-icons/ai";
import { BiSolidUserPin } from "react-icons/bi";
import { BsFunnel, BsThreeDots, BsThreeDotsVertical } from "react-icons/bs";
import { FaDoorOpen, FaHospital, FaUserCircle } from "react-icons/fa";
import { FaChevronDown, FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import { GrPowerReset, GrUndo } from "react-icons/gr";
import { HiDownload } from "react-icons/hi";
import {
	HiExclamationCircle,
	HiMagnifyingGlass,
	HiOutlineUsers,
} from "react-icons/hi2";
import { IoIosChatboxes, IoMdMenu } from "react-icons/io";
import { IoCloseOutline, IoFemale, IoMale } from "react-icons/io5";
import {
	MdAutoMode,
	MdContentCopy,
	MdHistory,
	MdModeEdit,
	MdOutlineSort,
	MdSignalCellular1Bar,
	MdSignalCellular3Bar,
	MdSignalCellular4Bar,
} from "react-icons/md";
import { RiRulerLine } from "react-icons/ri";
import { SlCalender } from "react-icons/sl";

const iconComponents = {
	alert: HiExclamationCircle,
	search: HiMagnifyingGlass,
	calendar: SlCalender,
	hospital: FaHospital,
	schedule: AiFillSchedule,
	userPin: BiSolidUserPin,
	group: HiOutlineUsers,
	chat: IoIosChatboxes,
	user: FaUserCircle,
	female: IoFemale,
	male: IoMale,
	idCard: AiOutlineIdcard,
	low: MdSignalCellular1Bar,
	mid: MdSignalCellular3Bar,
	high: MdSignalCellular4Bar,
	edit: MdModeEdit,
	dots: BsThreeDotsVertical,
	sort: MdOutlineSort,
	filter: BsFunnel,
	copy: MdContentCopy,
	door: FaDoorOpen,
	right: FaChevronRight,
	left: FaChevronLeft,
	undo: GrUndo,
	menu: IoMdMenu,
	close: IoCloseOutline,
	history: MdHistory,
	chevronDown: FaChevronDown,
	reset: GrPowerReset,
	heart: AiOutlineHeart,
	heartFilled: AiFillHeart,
	message: AiOutlineMessage,
	eye: AiOutlineEye,
	more: BsThreeDots,
	rule: RiRulerLine,
	auto: MdAutoMode,
	download: HiDownload,
};

export type IconName =
	| "sort"
	| "filter"
	| "chevronDown"
	| "heart"
	| "heartFilled"
	| "message"
	| "eye"
	| "more"
	| "rule"
	| "auto"
	| "download"
	| keyof typeof iconComponents;

interface IconProps {
	name: IconName;
	className?: string;
	size?: number;
	onClick?: () => void;
}

export const Icon = ({
	name,
	className = "",
	size = 24,
	onClick,
}: IconProps) => {
	const IconComponent = iconComponents[name];

	if (!IconComponent) {
		return null;
	}

	return <IconComponent className={className} size={size} onClick={onClick} />;
};
