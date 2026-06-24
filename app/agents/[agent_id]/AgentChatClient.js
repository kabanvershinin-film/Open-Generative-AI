"use client";

export default function AgentChatClient({ agentDetails, initialHistory, userData }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-8 text-white shadow-2xl shadow-black/30 backdrop-blur">
        <div className="mb-3 text-sm uppercase tracking-[0.2em] text-white/40">
          Агенты
        </div>
        <h1 className="mb-3 text-2xl font-semibold">Раздел временно отключён</h1>
        <p className="mb-6 text-sm leading-6 text-white/65">
          Страницы агентов сейчас исключены из активного использования и временно
          отключены, чтобы не блокировать сборку основного сайта.
        </p>
        <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/55">
          Агент: {agentDetails?.name || "не загружен"}
          <br />
          История: {initialHistory ? "есть" : "нет"}
          <br />
          Пользователь: {userData?.email || "не авторизован"}
        </div>
      </div>
    </div>
  );
}
