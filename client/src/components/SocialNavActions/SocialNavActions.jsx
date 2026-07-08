import MailMenu from './_components/MailMenu'
import SocialNotificationMenu from './_components/SocialNotificationMenu'

const SocialNavActions = () => {
  return (
    <div className="flex items-center gap-2">
      <SocialNotificationMenu />
      <MailMenu />
    </div>
  )
}

export default SocialNavActions
