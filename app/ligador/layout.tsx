import { LigadorAuthProvider } from "./LigadorAuth";

export default function LigadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LigadorAuthProvider>{children}</LigadorAuthProvider>;
}
