"use client";

import UserDropdown from '../navbar/UserDropdown';
import { Session } from "next-auth";

type ClientUserDropdownProps = {
  session: Session | null;
};

// Fake session data for testing
const fakeSession = {
  user: {
    id: "test-user-id",
    name: "Test User",
    email: "test@example.com",
    image: undefined,
    accessToken: "fake-access-token",
  },
  userRole: "admin", // Có thể thay đổi thành "user", "noc" để test các vai trò khác nhau
  expires: new Date(Date.now() + 86400000).toISOString(), // 24 giờ từ bây giờ
} as Session; // Cast to Session type

export const ClientUserDropdown = ({ session }: ClientUserDropdownProps) => {
  // Luôn sử dụng fakeSession thay vì session được truyền vào
  if (!session) {
    return null;
  }
  return <UserDropdown session={session} />;
}; 