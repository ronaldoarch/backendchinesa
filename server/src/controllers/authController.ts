import { Request, Response } from "express";
import { z } from "zod";
import {
  createUser,
  findUserByUsername,
  verifyPassword,
  generateToken,
  findUserById
} from "../services/authService";

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  phone: z.string().optional(),
  currency: z.string().default("BRL")
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string()
});

export async function registerController(req: Request, res: Response): Promise<void> {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos", details: parsed.error.flatten() });
    return;
  }

  const { username, password, phone, currency } = parsed.data;

  // Verificar se usuário já existe
  const existingUser = await findUserByUsername(username);
  if (existingUser) {
    res.status(400).json({ error: "Nome de usuário já está em uso" });
    return;
  }

  try {
    const user = await createUser(username, password, phone, currency);
    const token = generateToken(user);

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        currency: user.currency,
        is_admin: user.is_admin
      },
      token
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Erro ao criar usuário:", error);
    res.status(500).json({ error: "Erro ao criar usuário" });
  }
}

export async function loginController(req: Request, res: Response): Promise<void> {
  try {
    // eslint-disable-next-line no-console
    console.log("Login attempt:", { username: req.body?.username });
    
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      // eslint-disable-next-line no-console
      console.log("Login: Dados inválidos", parsed.error.flatten());
      res.status(400).json({ error: "Dados inválidos", details: parsed.error.flatten() });
      return;
    }

    const { username, password } = parsed.data;

    const user = await findUserByUsername(username);
    if (!user) {
      // eslint-disable-next-line no-console
      console.log("Login: Usuário não encontrado", username);
      res.status(401).json({ error: "Credenciais inválidas" });
      return;
    }

    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      // eslint-disable-next-line no-console
      console.log("Login: Senha inválida para usuário", username);
      res.status(401).json({ error: "Credenciais inválidas" });
      return;
    }

    const token = generateToken(user);

    const responseData = {
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        currency: user.currency,
        is_admin: user.is_admin
      },
      token
    };

    // eslint-disable-next-line no-console
    console.log("Login: Sucesso para usu?rio", username, {
      userId: user.id,
      is_admin_from_db: user.is_admin,
      is_admin_type: typeof user.is_admin,
      token_generated: !!token
    });
    res.json(responseData);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Login: Erro inesperado", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

export async function meController(req: Request, res: Response): Promise<void> {
  const userId = (req as any).userId;
  
  if (!userId) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }

  const user = await findUserById(userId);
  if (!user) {
    res.status(404).json({ error: "Usuário não encontrado" });
    return;
  }

  res.json({
    id: user.id,
    username: user.username,
    phone: user.phone,
    currency: user.currency,
    is_admin: user.is_admin
  });
}
