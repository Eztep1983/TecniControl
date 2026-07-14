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
    <div className="flex items-center justify-center mb-6 p-4 dark:bg-gray-700/50 bg-gray-300 rounded-lg border dark:border-gray-600 border-gray-300">
      {negocio.logoUrl && (
        <img 
          src={negocio.logoUrl} 
          alt={negocio.nombre} 
          className="w-16 h-16 object-contain mr-4 border dark:border-gray-600 border-gray-300 rounded"
        />
      )}
      <div className="text-center">
        <h1 className="text-2xl font-bold dark:text-white text-gray-900">{negocio.nombre}</h1>
        {negocio.direccion && <p className="text-sm dark:text-gray-300 text-gray-700">{negocio.direccion}</p>}
        {negocio.telefono && <p className="text-sm dark:text-gray-300 text-gray-700">Tel: {negocio.telefono}</p>}
        {negocio.email && <p className="text-sm dark:text-gray-300 text-gray-700">Email: {negocio.email}</p>}
        {negocio.nit && <p className="text-sm dark:text-gray-300 text-gray-700">NIT: {negocio.nit}</p>}
        <h2 className="text-xl font-semibold dark:text-blue-400 text-blue-700 mt-2">{titulo}</h2>
        {subtitulo && <p className="text-sm dark:text-gray-400 text-gray-600">{subtitulo}</p>}
      </div>
    </div>
  );
};