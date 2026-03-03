import { AdminAuthProvider } from "@/app/admin/AdminAuth";

export default function LigadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>;
}
