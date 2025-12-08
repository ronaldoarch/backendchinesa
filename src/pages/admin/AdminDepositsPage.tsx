import { useState } from "react";

type Deposit = {
  id: number;
  user: string;
  amount: number;
  status: "pendente" | "aprovado";
  createdAt: string;
};

export function AdminDepositsPage() {
  const [deposits] = useState<Deposit[]>([
    { id: 1, user: "João", amount: 100, status: "aprovado", createdAt: "2025-12-02" },
    { id: 2, user: "Maria", amount: 50, status: "pendente", createdAt: "2025-12-02" }
  ]);

  return (
    <section className="admin-section">
      <h1>Depósitos (demo)</h1>
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Usuário</th>
            <th>Valor</th>
            <th>Status</th>
            <th>Criado em</th>
          </tr>
        </thead>
        <tbody>
          {deposits.map((d) => (
            <tr key={d.id}>
              <td>{d.id}</td>
              <td>{d.user}</td>
              <td>R$ {d.amount.toFixed(2)}</td>
              <td>{d.status}</td>
              <td>{d.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}


