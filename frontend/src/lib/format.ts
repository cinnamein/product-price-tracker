import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ko";

dayjs.extend(relativeTime);
dayjs.locale("ko");

export function formatDate(dateStr: string): string {
  return dayjs(dateStr).format("YYYY.MM.DD HH:mm");
}

export function formatRelative(dateStr: string): string {
  return dayjs(dateStr).fromNow();
}

export function formatPrice(price: number): string {
  return price.toLocaleString("ko-KR") + "원";
}
