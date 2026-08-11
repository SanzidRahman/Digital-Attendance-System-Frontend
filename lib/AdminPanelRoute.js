// media route
export const ADMIN_MEDIA_EDIT = (id) => (id ? `/admin/media/edit/${id}` : "");
export const ADMIN_MEDIA_SHOW = "/admin/media/";
export const ADMIN_MEDIA_ADD = "/admin/media/add";
export const ADMIN_ATTENDANCE_CORRECTION = "/admin/attendance/correction";
export const ADMIN_MANUAL_ATTENDANCE = "/admin/attendance/manual";
export const ADMIN_ATTENDANCE_REPORT_DOWNLOAD = "/admin/attendance/report-download";


// trash route
export const ADMIN_TRASH = "/admin/trash/";

// Website route
export const WEBSITE_SHOP = "/shop/";
export const PRODUCT_SHOW = "/product/";
export const PRODUCT_DETAILS = (slug) =>
  slug ? `/product/${slug}` : "/product";


