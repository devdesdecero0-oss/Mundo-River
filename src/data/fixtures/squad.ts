import type { RawSquadPayload } from "@/domain/types";

/**
 * Payload crudo mock. En producción este JSON lo entrega el adaptador
 * server-side del proveedor (API-Football, Sportmonks, etc.).
 * El ID externo es estable; el ID canónico se deriva como `river:<externalId>`.
 */
export const RAW_SQUAD_PAYLOAD: RawSquadPayload = {
  provider: "river",
  fetchedAt: "2026-11-11T09:00:00.000Z",
  players: [
    { id: "armani", name: "Franco Armani", displayName: "Franco Armani", shirtNumber: 1, position: "GK", nationality: "Argentina", contractUntil: "2027-12-31", updatedAt: "2026-01-04" },
    { id: "ledesma", name: "Jeremías Ledesma", displayName: "Jeremías Ledesma", shirtNumber: 25, position: "GK", nationality: "Argentina", contractUntil: "2027-12-31", updatedAt: "2026-01-04" },
    { id: "beltran", name: "Santiago Beltrán", displayName: "Santiago Beltrán", shirtNumber: 12, position: "GK", nationality: "Argentina", updatedAt: "2026-01-04" },
    { id: "montiel", name: "Gonzalo Montiel", displayName: "Gonzalo Montiel", shirtNumber: 4, position: "DF", nationality: "Argentina", contractUntil: "2028-12-31", updatedAt: "2026-01-05" },
    { id: "bustos", name: "Fabricio Bustos", displayName: "Fabricio Bustos", shirtNumber: 16, position: "DF", nationality: "Argentina", updatedAt: "2026-01-05" },
    { id: "pezzella", name: "Germán Pezzella", displayName: "Germán Pezzella", shirtNumber: 6, position: "DF", nationality: "Argentina", contractUntil: "2027-12-31", updatedAt: "2026-01-05" },
    { id: "martinez-quarta", name: "Lucas Martínez Quarta", displayName: "Lucas Martínez Quarta", shirtNumber: 28, position: "DF", nationality: "Argentina", contractUntil: "2028-12-31", updatedAt: "2026-01-05" },
    { id: "paulo-diaz", name: "Paulo Díaz", displayName: "Paulo Díaz", shirtNumber: 17, position: "DF", nationality: "Chile", contractUntil: "2027-12-31", updatedAt: "2026-01-05" },
    { id: "acuna", name: "Marcos Acuña", displayName: "Marcos Acuña", shirtNumber: 21, position: "DF", nationality: "Argentina", contractUntil: "2027-12-31", updatedAt: "2026-01-05" },
    { id: "enzo-diaz", name: "Enzo Díaz", displayName: "Enzo Díaz", shirtNumber: 13, position: "DF", nationality: "Argentina", updatedAt: "2026-01-05" },
    { id: "casco", name: "Milton Casco", displayName: "Milton Casco", shirtNumber: 20, position: "DF", nationality: "Argentina", updatedAt: "2026-01-05" },
    { id: "ignacio-fernandez", name: "Ignacio Fernández", displayName: "Nacho Fernández", shirtNumber: 10, position: "MF", nationality: "Argentina", isCaptain: true, contractUntil: "2027-12-31", updatedAt: "2026-01-06" },
    { id: "simon", name: "Santiago Simón", displayName: "Santiago Simón", shirtNumber: 8, position: "MF", nationality: "Argentina", updatedAt: "2026-01-06" },
    { id: "aliendro", name: "Rodrigo Aliendro", displayName: "Rodrigo Aliendro", shirtNumber: 5, position: "MF", nationality: "Argentina", updatedAt: "2026-01-06" },
    { id: "castano", name: "Kevin Castaño", displayName: "Kevin Castaño", shirtNumber: 24, position: "MF", nationality: "Colombia", updatedAt: "2026-01-06" },
    { id: "mastantuono", name: "Franco Mastantuono", displayName: "Franco Mastantuono", shirtNumber: 30, position: "MF", nationality: "Argentina", contractUntil: "2028-12-31", updatedAt: "2026-01-06" },
    { id: "galoppo", name: "Giuliano Galoppo", displayName: "Giuliano Galoppo", shirtNumber: 11, position: "MF", nationality: "Argentina", updatedAt: "2026-01-06" },
    { id: "kranevitter", name: "Matías Kranevitter", displayName: "Matías Kranevitter", shirtNumber: 22, position: "MF", nationality: "Argentina", updatedAt: "2026-01-06" },
    { id: "driussi", name: "Sebastián Driussi", displayName: "Sebastián Driussi", shirtNumber: 9, position: "FW", nationality: "Argentina", contractUntil: "2028-12-31", updatedAt: "2026-01-07" },
    { id: "borja", name: "Miguel Borja", displayName: "Miguel Borja", shirtNumber: 7, position: "FW", nationality: "Colombia", contractUntil: "2027-12-31", updatedAt: "2026-01-07" },
    { id: "colidio", name: "Facundo Colidio", displayName: "Facundo Colidio", shirtNumber: 19, position: "FW", nationality: "Argentina", updatedAt: "2026-01-07" },
    { id: "subiabre", name: "Ian Subiabre", displayName: "Ian Subiabre", shirtNumber: 31, position: "FW", nationality: "Argentina", updatedAt: "2026-01-07" },
    { id: "ruberto", name: "Agustín Ruberto", displayName: "Agustín Ruberto", shirtNumber: 32, position: "FW", nationality: "Argentina", updatedAt: "2026-01-07" },
    { id: "lencina", name: "Tomás Lencina", displayName: "Tomás Lencina", shirtNumber: 26, position: "FW", nationality: "Argentina", updatedAt: "2026-01-07" },
  ],
};
