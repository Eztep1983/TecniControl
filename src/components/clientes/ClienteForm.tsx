"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/basic/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/basic/form";
import { Input } from "@/components/ui/basic/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/basic/card";
import { useToast } from "@/hooks/use-toast";
import type { Cliente, Dispositivo } from "@/types/orden";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Plus, Trash2, Monitor, Loader2, AlertCircle, CheckCircle2, ArrowLeft, Save, User, Mail, Phone, MapPin, IdCard, ChevronRight, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/basic/select";

// IMPORTAR LOS HELPERS MULTI-USUARIO
import { 
  crearCliente,
  actualizarCliente
} from '@/lib/multiuser-helpers'

const dispositivoSchema = z.object({
  tipo: z.string().min(1, { message: "Requerido" }),
  marca: z.string().min(1, { message: "Requerido" }),
  modelo: z.string().min(1, { message: "Requerido" }),
  numeroSerie: z.string().min(1, { message: "Requerido" }),
});

const formSchema = z.object({
  name: z.string().min(2, { message: "Mínimo 2 caracteres" }),
  cedula: z.string()
    .min(4, { message: "Mínimo 4 caracteres" })
    .regex(/^[0-9A-Za-z-]+$/, { message: "Solo números, letras y guiones" }),
  email: z.string().email({ message: "Email inválido" }),
  phone: z.string().min(8, { message: "Teléfono muy corto" }),
  address: z.string().optional(),
  dispositivos: z.array(dispositivoSchema).min(1, { message: "Agrega al menos un dispositivo" }),
});

type ClienteFormValues = z.infer<typeof formSchema>;

interface ClienteFormProps {
  initialData?: Cliente | null;
}

export function ClienteForm({ initialData }: ClienteFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const createDefaultValues = (data?: Cliente | null): ClienteFormValues => {
    if (data) {
      return {
        name: data.name || "",
        cedula: data.cedula || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        dispositivos: data.dispositivos?.map(d => ({
          tipo: d.tipo || "",
          marca: d.marca || "",
          modelo: d.modelo || "",
          numeroSerie: d.numeroSerie || "",
        })) || [{
          tipo: "",
          marca: "",
          modelo: "",
          numeroSerie: "",
        }]
      };
    }
    
    return {
      name: "",
      cedula: "",
      email: "",
      phone: "",
      address: "",
      dispositivos: [{
        tipo: "",
        marca: "",
        modelo: "",
        numeroSerie: "",
      }]
    };
  };

  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: createDefaultValues(initialData),
    mode: "onChange"
  });

  const dispositivos = form.watch("dispositivos") || [];

  useEffect(() => {
    if (initialData) {
      form.reset(createDefaultValues(initialData));
    }
  }, [initialData]);

  const agregarDispositivo = () => {
    const dispositivosActuales = form.getValues("dispositivos");
    form.setValue("dispositivos", [...dispositivosActuales, {
      tipo: "",
      marca: "",
      modelo: "",
      numeroSerie: "",
    }], { shouldValidate: false });
  };

  const eliminarDispositivo = (index: number) => {
    const dispositivosActuales = form.getValues("dispositivos");
    
    if (dispositivosActuales.length > 1) {
      form.setValue("dispositivos", dispositivosActuales.filter((_, i) => i !== index), { shouldValidate: true });
      toast({
        title: "Dispositivo eliminado",
        variant: "default",
      });
    } else {
      toast({
        title: "Debe haber al menos un dispositivo",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: ClienteFormValues) => {
    if (!user?.uid) {
      toast({
        title: "❌ Error",
        description: "Debe estar autenticado",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const dispositivosConId = data.dispositivos.map((dispositivo, index) => ({
        id: initialData?.dispositivos[index]?.id || `${Date.now()}-${index}`,
        tipo: dispositivo.tipo,
        marca: dispositivo.marca,
        modelo: dispositivo.modelo,
        numeroSerie: dispositivo.numeroSerie,
      }));

      const clienteData: any = {
        name: data.name,
        cedula: data.cedula,
        email: data.email,
        phone: data.phone,
        dispositivos: dispositivosConId,
        updatedAt: new Date().toISOString(),
        userId: user.uid
      };

      if (data.address?.trim()) {
        clienteData.address = data.address.trim();
      }

      if (initialData?.id) {
        await actualizarCliente(initialData.id, clienteData, user.uid);
        toast({
          title: "✅ Cliente actualizado",
          description: `${data.name} actualizado correctamente`,
        });
      } else {
        await crearCliente(clienteData, user.uid);
        toast({
          title: "✅ Cliente creado",
          description: `${data.name} creado correctamente`,
        });
      }
      
      setTimeout(() => {
        router.push("/clientes");
        router.refresh();
      }, 1000);
      
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "❌ Error",
        description: "No se pudo guardar el cliente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Validar paso actual
  const canGoToStep2 = async () => {
    const result = await form.trigger(["name", "cedula", "email", "phone"]);
    return result;
  };

  const handleNextStep = async () => {
    const isValid = await canGoToStep2();
    if (isValid) {
      setCurrentStep(2);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-800/40 rounded-xl border border-gray-700/50 p-6 text-center">
          <div className="w-16 h-16 bg-red-500/15 rounded-xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Acceso no autorizado</h2>
          <p className="text-sm text-gray-400 mb-4">Debes iniciar sesión</p>
          <Button onClick={() => router.push("/login")} className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-400">
            Iniciar Sesión
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* Header fijo */}
      <div className="sticky top-0 z-10 bg-gray-800/95 backdrop-blur-sm border-b border-gray-700/50">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="w-8 h-8 rounded-lg bg-gray-700/50 hover:bg-gray-700 flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-gray-400" />
              </button>
              <div>
                <h1 className="text-base sm:text-lg font-semibold text-white">
                  {initialData ? "Editar Cliente" : "Nuevo Cliente"}
                </h1>
                <p className="text-xs text-gray-400 hidden sm:block">
                  Paso {currentStep} de 2
                </p>
              </div>
            </div>
            
            {/* Indicador de pasos móvil */}
            <div className="flex gap-1.5 sm:hidden">
              <div className={`w-6 h-1.5 rounded-full transition-colors ${currentStep === 1 ? 'bg-blue-500' : 'bg-gray-700'}`} />
              <div className={`w-6 h-1.5 rounded-full transition-colors ${currentStep === 2 ? 'bg-blue-500' : 'bg-gray-700'}`} />
            </div>
          </div>
          
          {/* Indicador de pasos desktop */}
          <div className="hidden sm:flex items-center gap-2 mt-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${currentStep === 1 ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700/50 text-gray-400'}`}>
              <User className="w-4 h-4" />
              <span className="text-xs font-medium">Información</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-600" />
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${currentStep === 2 ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700/50 text-gray-400'}`}>
              <Monitor className="w-4 h-4" />
              <span className="text-xs font-medium">Dispositivos ({dispositivos.length})</span>
            </div>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-4xl mx-auto px-4 py-4">
          {/* Paso 1: Información del cliente */}
          {currentStep === 1 && (
            <div className="space-y-3 animate-in fade-in duration-300">
              <div className="bg-gray-800/40 rounded-xl border border-gray-700/50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-700/50 bg-gray-800/60">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">Datos del Cliente</h3>
                  </div>
                </div>
                
                <div className="p-4 space-y-3">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-gray-400">Nombre Completo *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ej: Juan Pérez" 
                            {...field} 
                            disabled={isLoading}
                            className="bg-gray-700/50 border-gray-600/50 text-white placeholder:text-gray-500 h-10"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cedula"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-gray-400">Cédula o NIT *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ej: 1234567890" 
                            {...field} 
                            disabled={isLoading}
                            className="bg-gray-700/50 border-gray-600/50 text-white placeholder:text-gray-500 h-10"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-gray-400">Email *</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="correo@ejemplo.com" 
                              {...field} 
                              disabled={isLoading}
                              className="bg-gray-700/50 border-gray-600/50 text-white placeholder:text-gray-500 h-10"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-gray-400">Teléfono *</FormLabel>
                          <FormControl>
                            <Input 
                              type="tel" 
                              placeholder="3001234567" 
                              {...field} 
                              disabled={isLoading}
                              className="bg-gray-700/50 border-gray-600/50 text-white placeholder:text-gray-500 h-10"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-gray-400">Dirección (Opcional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Calle 123 #45-67" 
                            {...field} 
                            disabled={isLoading}
                            className="bg-gray-700/50 border-gray-600/50 text-white placeholder:text-gray-500 h-10"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button 
                type="button"
                onClick={handleNextStep}
                className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-400 h-11"
              >
                Siguiente: Dispositivos
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Paso 2: Dispositivos */}
          {currentStep === 2 && (
            <div className="space-y-3 animate-in fade-in duration-300">
              <div className="bg-gray-800/40 rounded-xl border border-gray-700/50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-700/50 bg-gray-800/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                        <Monitor className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">Dispositivos</h3>
                        <p className="text-xs text-gray-400">{dispositivos.length} registrado{dispositivos.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={agregarDispositivo}
                      className="w-8 h-8 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-4 h-4 text-blue-400" />
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {dispositivos.map((dispositivo, index) => (
                    <div key={index} className="bg-gray-700/30 rounded-lg border border-gray-700/50 p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-400">Dispositivo {index + 1}</span>
                        {dispositivos.length > 1 && (
                          <button
                            type="button"
                            onClick={() => eliminarDispositivo(index)}
                            className="w-7 h-7 rounded-lg bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center transition-colors"
                          >
                            <X className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Tipo *</label>
                        <Select
                          value={dispositivo.tipo}
                          onValueChange={(value) => {
                            const current = form.getValues("dispositivos");
                            current[index].tipo = value;
                            form.setValue("dispositivos", current, { shouldValidate: true });
                          }}
                          disabled={isLoading}
                        >
                          <SelectTrigger className="bg-gray-700/50 border-gray-600/50 text-white h-9 text-sm">
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="impresora">Impresora</SelectItem>
                            <SelectItem value="fotocopiadora">Fotocopiadora</SelectItem>
                            <SelectItem value="multifuncional">Multifuncional</SelectItem>
                            <SelectItem value="escaner">Escáner</SelectItem>
                            <SelectItem value="plotter">Plotter</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                        {form.formState.errors.dispositivos?.[index]?.tipo && (
                          <p className="text-xs text-red-400 mt-1">{form.formState.errors.dispositivos[index].tipo.message}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Marca *</label>
                          <Input
                            value={dispositivo.marca}
                            onChange={(e) => {
                              const current = form.getValues("dispositivos");
                              current[index].marca = e.target.value;
                              form.setValue("dispositivos", current, { shouldValidate: true });
                            }}
                            placeholder="HP, Canon..."
                            disabled={isLoading}
                            className="bg-gray-700/50 border-gray-600/50 text-white placeholder:text-gray-500 h-9 text-sm"
                          />
                          {form.formState.errors.dispositivos?.[index]?.marca && (
                            <p className="text-xs text-red-400 mt-1">{form.formState.errors.dispositivos[index].marca.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Modelo *</label>
                          <Input
                            value={dispositivo.modelo}
                            onChange={(e) => {
                              const current = form.getValues("dispositivos");
                              current[index].modelo = e.target.value;
                              form.setValue("dispositivos", current, { shouldValidate: true });
                            }}
                            placeholder="LX-3200..."
                            disabled={isLoading}
                            className="bg-gray-700/50 border-gray-600/50 text-white placeholder:text-gray-500 h-9 text-sm"
                          />
                          {form.formState.errors.dispositivos?.[index]?.modelo && (
                            <p className="text-xs text-red-400 mt-1">{form.formState.errors.dispositivos[index].modelo.message}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Número de Serie *</label>
                        <Input
                          value={dispositivo.numeroSerie}
                          onChange={(e) => {
                            const current = form.getValues("dispositivos");
                            current[index].numeroSerie = e.target.value;
                            form.setValue("dispositivos", current, { shouldValidate: true });
                          }}
                          placeholder="ABC123XYZ456"
                          disabled={isLoading}
                          className="bg-gray-700/50 border-gray-600/50 text-white placeholder:text-gray-500 h-9 text-sm"
                        />
                        {form.formState.errors.dispositivos?.[index]?.numeroSerie && (
                          <p className="text-xs text-red-400 mt-1">{form.formState.errors.dispositivos[index].numeroSerie.message}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  variant="outline"
                  className="flex-1 bg-gray-700/50 hover:bg-gray-700 border-gray-600 text-gray-300 h-11"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Atrás
                </Button>
                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-400 h-11"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {initialData ? "Guardar" : "Crear"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}