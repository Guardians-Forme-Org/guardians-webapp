import Link from "next/link";

export default function GetStartedPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-white">
      {/* Hero — aerial forest photo placeholder */}
      <div className="relative flex-1 bg-gotf-green overflow-hidden flex items-center justify-center">
        {/* Dark green forest gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, #004d20 0%, #003518 40%, #002010 100%)",
          }}
        />

        {/* Subtle leaf texture overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 40%, #22c55e 0%, transparent 50%), radial-gradient(circle at 70% 20%, #15803d 0%, transparent 40%), radial-gradient(circle at 50% 70%, #166534 0%, transparent 45%)",
          }}
        />

        {/* Bottom fade to white */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent z-10" />

        {/* Guardians wordmark */}
        <div className="relative z-10 flex items-center gap-4">
          <img
            src="/images/Guardians Logo-logo.png"
            alt=""
            className="w-[70px] h-[70px] object-contain"
            style={{ filter: "brightness(0) invert(1)" }}
          />
          <div className="font-black leading-tight text-white uppercase">
            <p className="text-[28px]">
              Guardians<sup className="text-base tracking-normal font-black">s</sup>
            </p>
            <p className="text-[14px] font-semibold tracking-[0.25em] -mt-1">of the</p>
            <p className="text-[28px]">Future</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center gap-4 px-5 pt-6 pb-10">
        <Link
          href="/signup"
          className="flex items-center justify-center w-[338px] h-14 bg-black text-white rounded-full text-lg font-medium"
        >
          Get Started
        </Link>

        <p className="text-base text-black">
          Already have an account?{" "}
          <Link href="/login" className="text-[#3875e9]">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
