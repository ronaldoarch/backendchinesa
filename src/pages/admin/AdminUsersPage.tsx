import { useState } from "react";

type User = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
};

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([
    { id: 1, name: "João", email: "joao@example.com", createdAt: "2025-12-02" },
    { id: 2, name: "Maria", email: "maria@example.com", createdAt: "2025-12-02" }
  ]);

  const [form, setForm] = useState<{ name: string; email: string }>({
    name: "",
    email: ""
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setUsers((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        name: form.name,
        email: form.email,
        createdAt: new Date().toISOString().slice(0, 10)
      }
    ]);
    setForm({ name: "", email: "" });
  }

  return (
    <section className="admin-section">
      <h1>Usuários (demo)</h1>
      <form className="admin-form" onSubmit={handleCreate}>
        <input
          placeholder="Nome"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        <button className="btn btn-gold" type="submit">
          Adicionar usuário (demo)
        </button>
      </form>

      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Email</th>
            <th>Criado em</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}


