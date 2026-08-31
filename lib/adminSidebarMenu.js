import { AiOutlineDashboard } from "react-icons/ai";
import { BiCategory } from "react-icons/bi";
import { MdOutlineShoppingBag } from "react-icons/md";
import { LuUserRound } from "react-icons/lu";
import { IoMdStarOutline } from "react-icons/io";
import { ADMIN_ATTENDANCE_CORRECTION, ADMIN_ATTENDANCE_REPORT_DOWNLOAD, ADMIN_CATEGORY_ADD, ADMIN_CATEGORY_SHOW, ADMIN_MANUAL_ATTENDANCE } from "./AdminPanelRoute";


export const AdminSidebarMenu = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: AiOutlineDashboard,
  },
  {
    title: "BEd",
    href: "#",
    icon: BiCategory,
    submenu: [
      {
        title: "Section-A",
        href: ADMIN_MANUAL_ATTENDANCE,
      },
      {
        title: "Section-B",
        href: ADMIN_ATTENDANCE_CORRECTION
      },
      {
        title: "Section-C",
        href: ADMIN_MANUAL_ATTENDANCE,
      },
      {
        title: "Section-D",
        href: ADMIN_ATTENDANCE_CORRECTION
      },
    ],
  },
  {
    title: "BEd-Regular",
    href: "#",
    icon: BiCategory,
    submenu: [
      {
        title: "First-Year",
        href: ADMIN_MANUAL_ATTENDANCE,
      },
      {
        title: "Second-Year",
        href: ADMIN_ATTENDANCE_CORRECTION
      },
      {
        title: "Third-Year",
        href: ADMIN_MANUAL_ATTENDANCE,
      },
      {
        title: "Forth-Year",
        href: ADMIN_ATTENDANCE_CORRECTION
      },
    ],
  },
  {
    title: "MEd",
    href: "#",
    icon: BiCategory,
    submenu: [
      {
        title: "Section-A",
        href: ADMIN_MANUAL_ATTENDANCE,
      },
      {
        title: "Section-B",
        href: ADMIN_ATTENDANCE_CORRECTION
      },
      {
        title: "Section-C",
        href: ADMIN_MANUAL_ATTENDANCE,
      },
      {
        title: "Section-D",
        href: ADMIN_ATTENDANCE_CORRECTION
      },
    ],
  },


  {
    title: "Attendance-Report-Download",
    href: ADMIN_ATTENDANCE_REPORT_DOWNLOAD,
    icon: MdOutlineShoppingBag,
  },
  {
    title: "Attendance-Correction",
    href: ADMIN_ATTENDANCE_CORRECTION,
    icon: LuUserRound,
  },
  {
    title: "Manual-Attendance",
    href: ADMIN_MANUAL_ATTENDANCE,
    icon: IoMdStarOutline,
  },


];
