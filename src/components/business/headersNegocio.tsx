// components/NegocioHeader.tsx
import { Negocio } from '@/types/orden';

interface NegocioHeaderProps {
  negocio: Negocio | null;
  titulo: string;
  subtitulo?: string;
}

export const NegocioHeader = ({ negocio, titulo, subtitulo }: NegocioHeaderProps) => {
  if (!negocio) return null;

  return (
    <div className="flex items-center justify-center mb-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
      {negocio.logoUrl && (
        <img 
          src={negocio.logoUrl} 
          alt={negocio.nombre} 
          className="w-16 h-16 object-contain mr-4 border border-gray-600 rounded"
        />
      )}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">{negocio.nombre}</h1>
        {negocio.direccion && <p className="text-sm text-gray-300">{negocio.direccion}</p>}
        {negocio.telefono && <p className="text-sm text-gray-300">Tel: {negocio.telefono}</p>}
        {negocio.email && <p className="text-sm text-gray-300">Email: {negocio.email}</p>}
        {negocio.nit && <p className="text-sm text-gray-300">NIT: {negocio.nit}</p>}
        <h2 className="text-xl font-semibold text-blue-400 mt-2">{titulo}</h2>
        {subtitulo && <p className="text-sm text-gray-400">{subtitulo}</p>}
      </div>
    </div>
  );
};