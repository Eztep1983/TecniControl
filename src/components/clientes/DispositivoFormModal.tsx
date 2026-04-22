"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/basic/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/basic/form";
import { Input } from "@/components/ui/basic/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/basic/select";
import { Monitor, Loader2, X, CheckCircle2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { useState, useEffect } from "react";
import type { Cliente } from "@/types/orden";
import { actualizarCliente } from "@/lib/multiuser-helpers";
import { useAndroidBack } from "@/hooks/useAndroidBack";

const TIPO_OPTIONS = [
  "impresora",
  "fotocopiadora",
  "multifuncional",
  "escaner",
  "plotter",
  "otro",
] as const;

const dispositivoSchema = z.object({
  tipo: z.string().min(1, { message: "Requerido" }),
  marca: z.string().min(1, { message: "Requerido" }),
  modelo: z.string().min(1, { message: "Requerido" }),
  numeroSerie: z.string().min(1, { message: "Requerido" }),
});

type DispositivoFormValues = z.infer<typeof dispositivoSchema>;

interface DispositivoFormModalProps {
  open: boolean;
  cliente: Cliente;
  onClose: () => void;
  onSuccess: (clienteActualizado: Cliente) => void;
}

export function DispositivoFormModal({
  open,
  cliente,
  onClose,
  onSuccess,
}: DispositivoFormModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  useAndroidBack(open, onClose);

  const form = useForm<DispositivoFormValues>({
    resolver: zodResolver(dispositivoSchema),
    defaultValues: {
      tipo: "",
      marca: "",
      modelo: "",
      numeroSerie: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        tipo: "",
        marca: "",
        modelo: "",
        numeroSerie: "",
      });
    }
  }, [open, form]);

  const onSubmit = async (data: DispositivoFormValues) => {
    if (!user?.uid || !cliente.id) return;

    setIsLoading(true);

    try {
      const nuevoDispositivo = {
        ...data,
        id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      };

      const dispositivosActualizados = [...(cliente.dispositivos || []), nuevoDispositivo];

      const payload = {
        ...cliente,
        dispositivos: dispositivosActualizados,
        updatedAt: new Date().toISOString(),
      };

      await actualizarCliente(cliente.id, payload, user.uid);

      toast({
        title: "✓ Dispositivo agregado",
        description: `El dispositivo se agregó al cliente ${cliente.name}.`,
      });

      onSuccess(payload as Cliente);
      onClose();
    } catch (error) {
      console.error("Error agregando dispositivo:", error);
      toast({
        title: "❌ Error",
        description: "No se pudo agregar el dispositivo",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-sm mx-auto rounded-2xl bg-gray-900 border border-gray-700/60 p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-gray-700/50 flex-shrink-0">
          <div className="flex items-center justify-between gap-3 mb-1">
            <DialogTitle className="text-base font-semibold text-white flex items-center gap-2">
              <Monitor className="w-5 h-5 text-blue-400" />
              Nuevo Dispositivo
            </DialogTitle>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-40 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <p className="text-xs text-gray-400">Agregando a {cliente.name}</p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1">
            <div className="px-5 py-4 space-y-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-gray-400">Tipo *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger className="bg-gray-800/60 border-gray-700/50 text-white h-10 rounded-xl focus:border-blue-500/50 focus:ring-blue-500/20">
                          <SelectValue placeholder="Seleccionar…" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {TIPO_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t} className="capitalize">
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="marca"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-gray-400">Marca *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="HP, Canon…"
                          disabled={isLoading}
                          className="bg-gray-800/60 border-gray-700/50 text-white placeholder:text-gray-600 h-10 rounded-xl focus:border-blue-500/50 focus:ring-blue-500/20"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="modelo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-gray-400">Modelo *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="LX-3200…"
                          disabled={isLoading}
                          className="bg-gray-800/60 border-gray-700/50 text-white placeholder:text-gray-600 h-10 rounded-xl focus:border-blue-500/50 focus:ring-blue-500/20"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="numeroSerie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-gray-400">Número de serie *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="ABC123XYZ"
                        disabled={isLoading}
                        className="bg-gray-800/60 border-gray-700/50 text-white placeholder:text-gray-600 h-10 rounded-xl font-mono focus:border-blue-500/50 focus:ring-blue-500/20"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <div className="px-5 py-4 border-t border-gray-700/50 flex-shrink-0 bg-gray-900/80 backdrop-blur-sm flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 h-11 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 h-11 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 active:bg-blue-500/35 border border-blue-500/25 text-blue-400 text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Agregando…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Agregar
                  </>
                )}
              </button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
