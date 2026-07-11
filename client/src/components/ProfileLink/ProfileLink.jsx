import { Link } from 'react-router-dom'

// The one way to link to a user's public profile (#397). Callers wrap whatever
// identity they render (an avatar, a name, both) and this owns the route
// construction, so `/users/:username` is not hand-built across the app.
// Null-object behaviour: with no username to link to (deleted or system
// users), it renders the children in a plain span so callers need no guard.
const ProfileLink = ({ username, className = '', children, ...props }) => {
  if (!username) {
    return <span className={className}>{children}</span>
  }

  return (
    <Link
      className={className}
      to={`/users/${encodeURIComponent(username)}`}
      {...props}
    >
      {children}
    </Link>
  )
}

export default ProfileLink
