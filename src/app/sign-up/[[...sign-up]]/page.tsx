import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex">

      {/* Left — image + text */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=1400&q=90')" }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.05) 100%)' }} />
        <div className="relative z-10 flex flex-col justify-end p-14 pb-16">
          <p className="text-white/60 text-sm font-medium uppercase tracking-widest mb-3">AI-Powered</p>
          <h1 className="text-5xl font-bold text-white leading-tight mb-4">Solution Hub</h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-sm">
            Your team's central knowledge repository — decks, demos, proposals and AI-extracted insights, all in one place.
          </p>
        </div>
      </div>

      {/* Right — Clerk */}
      <div className="w-full lg:w-[520px] flex flex-col items-center justify-center px-10 py-16 bg-white">
        <div className="w-full max-w-sm">
          <SignUp fallbackRedirectUrl="/dashboard" />
        </div>
      </div>

    </div>
  );
}
