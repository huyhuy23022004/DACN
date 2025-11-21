// FooterTravelPro.jsx
import { Facebook, Instagram, Youtube, Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-200">
      {/* top wave / highlight */}
      <div className="h-1 bg-linear-to-r from-emerald-400 via-sky-400 to-purple-400" />

      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand */}
        <div>
          <h2 className="text-2xl font-bold tracking-wide text-white">
            HCMUNRE
          </h2>
          <p className="mt-4 text-sm text-slate-400 leading-relaxed">
            Cập nhật tin tức du lịch, điểm đến hot, kinh nghiệm & review chân thực
            mỗi ngày.
          </p>

          <div className="mt-5 flex items-center gap-3">
            <a className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition" href="#">
              <Facebook size={18} />
            </a>
            <a className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition" href="#">
              <Instagram size={18} />
            </a>
            <a className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition" href="#">
              <Youtube size={18} />
            </a>
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h3 className="text-white font-semibold text-lg">Khám phá</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-400">
            <li><a className="hover:text-white transition" href="#">Điểm đến nổi bật</a></li>
            <li><a className="hover:text-white transition" href="#">Tin tức mới</a></li>
            <li><a className="hover:text-white transition" href="#">Review khách sạn</a></li>
            <li><a className="hover:text-white transition" href="#">Ẩm thực & văn hóa</a></li>
            <li><a className="hover:text-white transition" href="#">Mẹo du lịch</a></li>
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h3 className="text-white font-semibold text-lg">Chuyên mục</h3>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {["Biển đảo", "Núi rừng", "City Tour", "Phượt", "Resort", "Check-in", "Săn vé rẻ"].map((tag) => (
              <a
                key={tag}
                href="#"
                className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 transition"
              >
                {tag}
              </a>
            ))}
          </div>
        </div>

        {/* Newsletter + contact */}
        <div>
          <h3 className="text-white font-semibold text-lg">Nhận bản tin</h3>
          <p className="mt-4 text-sm text-slate-400">
            Nhập email để nhận tin du lịch mới & ưu đãi mỗi tuần.
          </p>
          <form className="mt-4 flex gap-2">
            <input
              type="email"
              placeholder="Email của bạn"
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:outline-none focus:border-emerald-400 text-sm"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition"
            >
              Gửi
            </button>
          </form>

          <div className="mt-6 space-y-3 text-sm text-slate-400">
            <div className="flex items-center gap-2"><MapPin size={16}/> TP.HCM, Việt Nam</div>
            <div className="flex items-center gap-2"><Phone size={16}/> 0909 000 111</div>
            <div className="flex items-center gap-2"><Mail size={16}/> hello@travelnews.vn</div>
          </div>
        </div>
      </div>

      {/* bottom */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} TravelNews. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition">Điều khoản</a>
            <a href="#" className="hover:text-white transition">Bảo mật</a>
            <a href="#" className="hover:text-white transition">Liên hệ</a>
          </div>
        </div>
      </div>
    </footer>
  );
}