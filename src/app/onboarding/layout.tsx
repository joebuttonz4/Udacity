export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#081420] via-[#0D1117] to-[#0D1117] flex flex-col">
      {children}
    </div>
  );
}