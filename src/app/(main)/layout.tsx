import { AppHeader } from "../../../components/AppHeader";

/**
 * Layout for the persona-aware app surfaces — `/`, `/dashboard*`, `/history`,
 * `/support`. Renders `<AppHeader />` (persona name, Switch persona, nav
 * links) above the page content.
 *
 * The recipient-facing `(share)` route group has its own layout that does
 * NOT import `<AppHeader />`, per tech-spec §S11 F1.8 (route-group / layout
 * separation is the only acceptable enforcement shape — conditional-render
 * was rejected because it leaves a behavioural seam).
 */
export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AppHeader />
      <div className="flex-1">{children}</div>
    </>
  );
}
