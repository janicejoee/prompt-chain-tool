type Props = {
  redirect?: string;
  className?: string;
  children?: React.ReactNode;
};

/** Logout must use POST: a Link to /auth/logout is prefetched (GET) and must not sign out. */
export function LogoutButton({
  redirect = "/",
  className,
  children = "Logout",
}: Props) {
  return (
    <form action="/auth/logout" method="post" className="inline">
      <input type="hidden" name="redirect" value={redirect} />
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}
