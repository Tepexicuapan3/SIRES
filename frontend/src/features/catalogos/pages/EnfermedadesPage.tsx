import { useEffect, useState } from "react";
import { EnfermedadesResource } from "@/api/resources/catalogos/enfermedades.resource";
import type { EnfermedadListItem } from "@/api/types/catalogos/enfermedades.types";

const EnfermedadesPage = () => {
  const [data, setData] = useState<EnfermedadListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    EnfermedadesResource.list()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Cargando enfermedades...</p>;

  return (
    <div>
      <h2>Catálogo de Enfermedades</h2>

      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th>Versión CIE</th>
          </tr>
        </thead>
        <tbody>
          {data.map((e) => (
            <tr key={e.id}>
              <td>{e.code}</td>
              <td>{e.name}</td>
              <td>{e.cieVersion}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EnfermedadesPage;