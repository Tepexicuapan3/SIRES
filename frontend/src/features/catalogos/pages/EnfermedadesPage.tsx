import { useEnfermedadesList } from "@features/catalogos/queries/useEnfermedadesList";

const EnfermedadesPage = () => {
  const { data = [], isLoading } = useEnfermedadesList();

  if (isLoading) return <p>Cargando enfermedades...</p>;

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
