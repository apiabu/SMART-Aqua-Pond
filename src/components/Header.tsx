export default function Header() {
  return (
    <header className="flex h-20 items-center border-b border-slate-200 bg-white px-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900">
          Dashboard
        </h2>

        <p className="text-sm text-slate-500">
          Fishpond Monitoring and Control System
        </p>
      </div>
    </header>
  );
}