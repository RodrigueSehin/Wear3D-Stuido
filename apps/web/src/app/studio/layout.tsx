/** Studio plein écran : aucune barre latérale de l'application (CDC §3.3). */
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <div className="h-dvh overflow-hidden">{children}</div>;
}
