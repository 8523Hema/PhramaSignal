import Link from "next/link";
import { Pill } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#111827] text-slate-300 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <Link href="/" className="flex items-center gap-2 mb-4">
            <Pill size={24} className="text-[#16a34a]" />
            <span className="font-black text-xl text-white tracking-tight">
              PharmaSignal <span className="text-[#16a34a]">India</span>
            </span>
          </Link>
          <p className="text-sm text-slate-400">
            Real patient signals. Indian brands. Your language. Democratizing drug safety information for India.
          </p>
        </div>
        
        <div>
          <h4 className="font-bold text-white mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-[#16a34a] transition-colors">Drug Scanner</Link></li>
            <li><Link href="/interaction" className="hover:text-[#16a34a] transition-colors">Interaction Checker</Link></li>
            <li><Link href="#" className="hover:text-[#16a34a] transition-colors">About Us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white mb-4">Supported Languages</h4>
          <p className="text-sm text-slate-400">
            English, हिंदी, தமிழ், తెలుగు, ಕನ್ನಡ, മലയാളം, বাংলা, मराठी, ગુજરાતી, ਪੰਜਾਬੀ, ଓଡ଼ିଆ
          </p>
        </div>
      </div>

      {/* NOT MEDICAL ADVICE BANNER - Sticky on Mobile, Static on Desktop */}
      <div className="bg-amber-400/10 border-t border-amber-400/20 sticky bottom-0 md:static z-40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <p className="text-xs md:text-sm text-amber-200/90 font-medium text-center leading-relaxed">
            <span className="font-bold text-amber-400">⚕ NOT MEDICAL ADVICE:</span> PharmaSignal India is for informational purposes only. Always consult a licensed doctor or pharmacist before taking, changing, or stopping any medication.
          </p>
        </div>
      </div>
    </footer>
  );
}
