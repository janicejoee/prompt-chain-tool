type Props = {
  redirect?: string;
  className?: string;
  children?: React.ReactNode;
};

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
