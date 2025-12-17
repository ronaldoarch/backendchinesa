import axios from "axios";

const PLAYFIVERS_BASE_URL =
  process.env.PLAYFIVERS_BASE_URL ?? "https://api.playfivers.com/api";
const PLAYFIVERS_API_KEY = process.env.PLAYFIVERS_API_KEY ?? "";

if (!PLAYFIVERS_API_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    "PLAYFIVERS_API_KEY não configurada. Adicione sua chave da PlayFivers no .env."
  );
}

const client = axios.create({
  baseURL: PLAYFIVERS_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${PLAYFIVERS_API_KEY}`
  },
  timeout: 15000
});

type RegisterGamePayload = {
  providerExternalId: string;
  gameExternalId: string;
  name: string;
};

export const playFiversService = {
  async registerGame(payload: RegisterGamePayload) {
    // ATENÇÃO: ajuste o endpoint conforme a doc oficial da PlayFivers:
    // ex: POST /casino/games ou similar.
    const { data } = await client.post("/casino/games", {
      provider_id: payload.providerExternalId,
      game_id: payload.gameExternalId,
      name: payload.name
    });
    return data;
  }
};


