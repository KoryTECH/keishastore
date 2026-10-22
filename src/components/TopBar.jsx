import { Download, ShieldCheck, Headset } from 'lucide-react'

export default function TopBar() {
  return (
    <div className="topbar">
      <div className="container topbar-inner">
        <div className="topbar-group">
          <span className="topbar-item">
            <Download size={13} /> Instant download after checkout
          </span>
          <span className="topbar-item">
            <ShieldCheck size={13} /> 100% secure payments
          </span>
        </div>
        <div className="topbar-group">
          <span className="topbar-item">
            <Headset size={13} /> Support: hello@keishastore.com
          </span>
          <span className="topbar-item">Learn. Read. Grow.</span>
        </div>
      </div>
    </div>
  )
}
