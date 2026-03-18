import { useState } from 'react';
import { Search, RefreshCw, UserCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useExpediente } from '../queries/useExpediente';
import { useActualizarExpediente } from '../mutations/useActualizarExpediente';

export default function ExpedientesAdminPage() {
  const [input, setInput] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const { data, isLoading, isFetching } = useExpediente(busqueda);
  const actualizar = useActualizarExpediente();

  const personas = [
    ...(data?.empleados ?? []).map((e) => ({ ...e, _tipo: 'empleado' as const })),
    ...(data?.familiares ?? []).map((f) => ({
      NO_EXP: f.NO_EXPF,
      DS_PATERNO: f.DS_PATERNO,
      DS_MATERNO: f.DS_MATERNO,
      DS_NOMBRE: f.DS_NOMBRE,
      CD_LABORAL: null,
      CVE_BAJA: null,
      FEC_BAJA: null,
      FE_NAC: f.FE_NAC,
      FEC_VIG: f.FEC_VIG,
      PARENTESCO: f.CD_PARENTESCO ?? 'FAMILIAR',
      CLINICA: f.CLINICA,
      ESTATUS: f.ESTATUS as string,
      EDAD: f.EDAD,
      FOTO: f.FOTO,
      _tipo: 'familiar' as const,
    })),
  ];

  const handleBuscar = () => setBusqueda(input.trim());
  const handleLimpiar = () => { setInput(''); setBusqueda(''); };

  const handleActualizar = () => {
    if (!busqueda) return;
    actualizar.mutate({ expediente: busqueda });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Consulta de Expedientes</h1>
        <p className="text-txt-muted text-sm mt-1">
          Busca y sincroniza expedientes desde Oracle.
        </p>
      </div>

      {/* Buscador */}
      <div className="flex gap-2 max-w-lg">
        <Input
          placeholder="Número de expediente"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
        />
        <Button onClick={handleBuscar} disabled={isLoading || isFetching}>
          <Search className="w-4 h-4 mr-2" />
          Buscar
        </Button>
        <Button
          variant="outline"
          onClick={handleActualizar}
          disabled={!busqueda || actualizar.isPending}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${actualizar.isPending ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
        <Button
          variant="outline"
          onClick={handleLimpiar}
          disabled={!input && !busqueda}
        >
          <X className="w-4 h-4 mr-2" />
          Limpiar
        </Button>
      </div>

      {/* Resultados */}
      {isLoading && <p className="text-txt-muted text-sm">Buscando...</p>}

      {!isLoading && busqueda && personas.length === 0 && (
        <p className="text-txt-muted text-sm">
          No se encontraron registros para <strong>{busqueda}</strong>.
        </p>
      )}

      {personas.length > 0 && (
        <>
          {/* Resumen del expediente */}
          <div className="flex items-center gap-6 px-4 py-3 rounded-lg border bg-muted/40 text-sm">
            <span>
              <span className="text-txt-muted">Expediente:</span>{' '}
              <span className="font-semibold">{busqueda}</span>
            </span>
            {data?.empleados[0]?.CD_LABORAL && (
              <span>
                <span className="text-txt-muted">Calidad Laboral:</span>{' '}
                <span className="font-semibold">{data.empleados[0].CD_LABORAL}</span>
              </span>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-txt-muted">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Nombre</th>
                  <th className="px-3 py-2 text-left">Edad</th>
                  <th className="px-3 py-2 text-left">Parentesco</th>
                  <th className="px-3 py-2 text-left">Estatus</th>
                  <th className="px-3 py-2 text-left">Clínica</th>
                  <th className="px-3 py-2 text-left">Vigencia</th>
                  <th className="px-3 py-2 text-left">Foto</th>
                </tr>
              </thead>
              <tbody>
                {personas.map((p, i) => (
                  <tr key={`${p.NO_EXP}-${i}`} className="border-t hover:bg-muted/40">
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2 font-medium">
                      {[p.DS_PATERNO, p.DS_MATERNO, p.DS_NOMBRE].filter(Boolean).join(' ')}
                    </td>
                    <td className="px-3 py-2">{p.EDAD ?? '—'}</td>
                    <td className="px-3 py-2">{p.PARENTESCO}</td>
                    <td className="px-3 py-2">
                      <Badge variant={p.ESTATUS === 'ACTIVO' ? 'stable' : 'critical'}>
                        {p.ESTATUS}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">{p.CLINICA ?? '—'}</td>
                    <td className="px-3 py-2">{p.FEC_VIG ?? '--/--'}</td>
                    <td className="px-3 py-2">
                      {p.FOTO ? (
                        <img
                          src={`data:image/jpeg;base64,${p.FOTO}`}
                          alt="Foto"
                          className="w-32 h-auto border rounded"
                        />
                      ) : (
                        <div className="w-14 h-16 border rounded flex items-center justify-center bg-muted">
                          <UserCircle className="w-6 h-6 text-txt-hint" />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
