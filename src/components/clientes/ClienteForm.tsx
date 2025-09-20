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
import { Plus, Trash2, Monitor, Loader2, AlertCircle, CheckCircle2, ArrowLeft, Save, User, Mail, Phone, MapPin, IdCard } from "lucide-react";
import { Badge } from "@/components/ui/basic/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/basic/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/basic/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/basic/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/basic/tabs";

// IMPORTAR LOS HELPERS MULTI-USUARIO
import { 
  crearCliente,
  actualizarCliente
} from '@/lib/multiuser-helpers'

const dispositivoSchema = z.object({
  tipo: z.string().min(1, { message: "El tipo es requerido" }),
  marca: z.string().min(1, { message: "La marca es requerida" }),
  modelo: z.string().min(1, { message: "El modelo es requerido" }),
  numeroSerie: z.string().min(1, { message: "El número de serie es requerido" }),
});

const formSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  cedula: z.string()
    .min(4, { message: "La cédula/NIT debe tener al menos 4 caracteres." })
    .regex(/^[0-9A-Za-z-]+$/, { message: "Solo se permiten números, letras y guiones." }),
  email: z.string().email({ message: "Por favor ingrese un email válido." }),
  phone: z.string().min(8, { message: "El número de teléfono parece muy corto." }),
  address: z.string().optional(),
  dispositivos: z.array(dispositivoSchema).min(1, { message: "Debe agregar al menos un dispositivo" }),
});

type ClienteFormValues = z.infer<typeof formSchema>;

interface ClienteFormProps {
  initialData?: Cliente | null;
}

export function ClienteForm({ initialData }: ClienteFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth(); // OBTENER USUARIO AUTENTICADO
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("cliente");

  // Función para crear valores por defecto seguros
  const createDefaultValues = (data?: Cliente | null): ClienteFormValues => {
    
    if (data) {
      const result = {
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
      return result;
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

  // Usar directamente los valores del formulario en lugar de estado separado
  const dispositivos = form.watch("dispositivos") || [];

  // Efecto simplificado que se ejecuta cada vez que cambia initialData
  useEffect(() => {
    
    if (initialData) {
      const resetData = createDefaultValues(initialData);      
      // Reset inmediato sin setTimeout
      form.reset(resetData);
      
    }
  }, [initialData]); // Dependencia simple: solo initialData

  const agregarDispositivo = () => {
    const dispositivosActuales = form.getValues("dispositivos");
    const nuevosDispositivos = [...dispositivosActuales, {
      tipo: "",
      marca: "",
      modelo: "",
      numeroSerie: "",
    }];
    form.setValue("dispositivos", nuevosDispositivos, { shouldValidate: true });
    
    toast({
      title: "Dispositivo agregado",
      description: "Debes completar los detalles del nuevo dispositivo.",
      variant: "default",
    });
  };

  const eliminarDispositivo = (index: number) => {
    const dispositivosActuales = form.getValues("dispositivos");
    
    if (dispositivosActuales.length > 1) {
      const nuevosDispositivos = dispositivosActuales.filter((_, i) => i !== index);
      form.setValue("dispositivos", nuevosDispositivos, { shouldValidate: true });
      
      toast({
        title: "Dispositivo eliminado",
        description: "El dispositivo ha sido removido de la lista.",
        variant: "default",
      });
    } else {
      toast({
        title: "No se puede eliminar",
        description: "Debe haber al menos un dispositivo.",
        variant: "destructive",
      });
    }
  };

  const actualizarDispositivo = (index: number, campo: string, valor: string) => {
    const dispositivosActuales = form.getValues("dispositivos");
    const nuevosDispositivos = [...dispositivosActuales];
    nuevosDispositivos[index] = { ...nuevosDispositivos[index], [campo]: valor };
    form.setValue("dispositivos", nuevosDispositivos, { shouldValidate: true });
  };

  const onSubmit = async (data: ClienteFormValues) => {
    if (!user?.uid) {
      toast({
        title: "❌ Error",
        description: "Debe estar autenticado para realizar esta acción.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setFormError(null);
    
    try {
      // Convertir dispositivos al formato correcto, filtrando undefined
      const dispositivosConId = data.dispositivos.map((dispositivo, index) => {
        const dispositivoData: any = {
          id: initialData?.dispositivos[index]?.id || `${Date.now()}-${index}`,
          tipo: dispositivo.tipo,
          marca: dispositivo.marca,
          modelo: dispositivo.modelo,
          numeroSerie: dispositivo.numeroSerie,
        };

        return dispositivoData;
      });

      // Construir datos del cliente, filtrando undefined
      const clienteData: any = {
        name: data.name,
        cedula: data.cedula,
        email: data.email,
        phone: data.phone,
        dispositivos: dispositivosConId,
        updatedAt: new Date().toISOString(),
        userId: user.uid // INCLUIR USER ID PARA MULTI-USUARIO
      };

      // Solo agregar campos opcionales si tienen valor
      if (data.address && data.address.trim()) {
        clienteData.address = data.address.trim();
      }

      if (initialData && initialData.id) {
        // Actualizar cliente existente usando helper multi-usuario
        await actualizarCliente(initialData.id, clienteData, user.uid);
        toast({
          title: "✅ Cliente Actualizado",
          description: `El cliente ${data.name} ha sido actualizado correctamente.`,
          variant: "default",
        });
      } else {
        // Crear nuevo cliente usando helper multi-usuario
        await crearCliente(clienteData, user.uid);
        toast({
          title: "Cliente Creado Satisfactoriamente",
          description: `El cliente ${data.name} ha sido creado correctamente.`,
          variant: "default",
        });
      }
      
      // Redirigir después de un breve delay para que el usuario vea el mensaje de éxito
      setTimeout(() => {
        router.push("/clientes");
        router.refresh();
      }, 1000);
      
    } catch (error) {
      console.error("Error al guardar el cliente:", error);
      const errorMessage = error instanceof Error ? error.message : "Ocurrió un error inesperado";
      setFormError(errorMessage);
      
      toast({
        title: "❌ Error",
        description: "Ocurrió un error al guardar el cliente. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // VERIFICAR QUE EL USUARIO ESTÉ AUTENTICADO
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-gray-800 bg-gray-800/80 backdrop-blur-sm">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <div className="p-3 bg-red-500/20 rounded-full mb-4">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Acceso no autorizado</h2>
            <p className="text-gray-400 mb-4">Debes iniciar sesión para acceder a esta página.</p>
            <Button 
              onClick={() => router.push("/login")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Ir a Iniciar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 p-4 sm:p-6 ">
      <div className="max-w-4xl mx-auto">
        {/* Header con navegación */}
        <div className="flex items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {initialData ? "Editar Cliente" : ""}
            </h1>
            <p className="text-gray-400 text-sm">
              {initialData ? "Actualiza la información del cliente" : "Completa la información para agregar un nuevo cliente"}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {formError && (
              <Alert variant="destructive" className="animate-in fade-in duration-300 border-red-800 bg-red-900/20">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            
            {/* Tabs para organizar el formulario */}
            <Tabs defaultValue="cliente" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800 border border-gray-700 p-1">
                <TabsTrigger 
                  value="cliente" 
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <User className="w-4 h-4 mr-2" />
                  Información 
                </TabsTrigger>
                <TabsTrigger 
                  value="dispositivos" 
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  disabled={dispositivos.length === 0}
                >
                  <Monitor className="w-4 h-4 mr-2" />
                  Dispositivos ({dispositivos.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="cliente" className="pt-4">
                <Card className="shadow-lg border-gray-700 bg-gray-800/70 backdrop-blur-sm">
                  <CardHeader className="pb-4 border-b border-gray-700">
                    <CardTitle className="text-xl font-semibold text-white flex items-center">
                      <div className="w-2 h-6 bg-blue-500 rounded-full mr-3"></div>
                      Información del Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center text-gray-300">
                              <User className="w-4 h-4 mr-2 text-blue-400" />
                              <span>Nombre Completo</span>
                              <span className="text-red-400 ml-1">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Nombre del cliente" 
                                {...field} 
                                disabled={isLoading}
                                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition-colors"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="cedula"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center text-gray-300">
                              <IdCard className="w-4 h-4 mr-2 text-blue-400" />
                              <span>Número de Cédula o NIT</span>
                              <span className="text-red-400 ml-1">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="text" 
                                placeholder="Cédula o NIT del cliente" 
                                {...field} 
                                disabled={isLoading}
                                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition-colors"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center text-gray-300">
                              <Mail className="w-4 h-4 mr-2 text-blue-400" />
                              <span>Email</span>
                              <span className="text-red-400 ml-1">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="cliente@ejemplo.com" 
                                {...field} 
                                disabled={isLoading}
                                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition-colors"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center text-gray-300">
                              <Phone className="w-4 h-4 mr-2 text-blue-400" />
                              <span>Teléfono</span>
                              <span className="text-red-400 ml-1">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="tel" 
                                placeholder="(57) 123-456-7890" 
                                {...field} 
                                disabled={isLoading}
                                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition-colors"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center text-gray-300">
                            <MapPin className="w-4 h-4 mr-2 text-blue-400" />
                            Dirección
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Dirección completa del cliente" 
                              {...field} 
                              disabled={isLoading}
                              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition-colors"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="pt-4 flex justify-end">
                      <Button 
                        type="button" 
                        onClick={() => setActiveTab("dispositivos")}
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={dispositivos.length === 0}
                      >
                        Siguiente: Dispositivos
                        <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="dispositivos" className="pt-4">
                <Card className="shadow-lg border-gray-700 bg-gray-800/70 backdrop-blur-sm">
                  <CardHeader className="pb-4 border-b border-gray-700">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                      <CardTitle className="text-xl font-semibold text-white flex items-center">
                        <Monitor className="w-5 h-5 mr-2 text-blue-400" />
                        Dispositivos del Cliente
                        <Badge className="ml-2 bg-blue-500/20 text-blue-300 border-blue-500/30">
                          {dispositivos.length} {dispositivos.length === 1 ? 'dispositivo' : 'dispositivos'}
                        </Badge>
                      </CardTitle>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              size="sm"
                              onClick={agregarDispositivo}
                              disabled={isLoading}
                              className="border-blue-500/30 text-blue-300 bg-gray-700 hover:bg-gray-600 text-white border-gray-600 hover:border-gray-500"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Agregar
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Agregar nuevo dispositivo</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-6 space-y-6">
                    {form.formState.errors.dispositivos && (
                      <Alert variant="destructive" className="animate-in fade-in duration-300 border-red-800 bg-red-900/20">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error en dispositivos</AlertTitle>
                        <AlertDescription>
                          {form.formState.errors.dispositivos.message}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {dispositivos.map((dispositivo, index) => (
                      <div key={index} className="p-4 border border-gray-700 rounded-lg relative bg-gray-700/30 transition-all hover:bg-gray-700/50 group">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center">
                            <h4 className="text-sm font-semibold text-gray-300">
                              Dispositivo {index + 1}
                            </h4>
                            {dispositivo.tipo && (
                              <Badge variant="secondary" className="ml-2 bg-gray-600 text-gray-300">
                                {dispositivo.tipo}
                              </Badge>
                            )}
                          </div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => eliminarDispositivo(index)}
                                  disabled={isLoading || dispositivos.length <= 1}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors opacity-70 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Eliminar dispositivo</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Tipo de Dispositivo <span className="text-red-400">*</span>
                            </label>
                            <Select
                              value={dispositivo.tipo}
                              onValueChange={(value) => actualizarDispositivo(index, "tipo", value)}
                              disabled={isLoading}
                            >
                              <SelectTrigger className="bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-blue-500">
                                <SelectValue placeholder="Seleccionar tipo..." />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                <SelectItem value="impresora" className="focus:bg-gray-700">Impresora</SelectItem>
                                <SelectItem value="fotocopiadora" className="focus:bg-gray-700">Fotocopiadora</SelectItem>
                                <SelectItem value="multifuncional" className="focus:bg-gray-700">Multifuncional</SelectItem>
                                <SelectItem value="escaner" className="focus:bg-gray-700">Escáner</SelectItem>
                                <SelectItem value="plotter" className="focus:bg-gray-700">Plotter</SelectItem>
                                <SelectItem value="otro" className="focus:bg-gray-700">Otro</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Marca <span className="text-red-400">*</span>
                            </label>
                            <Input
                              value={dispositivo.marca}
                              onChange={(e) => actualizarDispositivo(index, "marca", e.target.value)}
                              placeholder="Ej: Canon, HP, Epson"
                              required
                              disabled={isLoading}
                              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition-colors"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Modelo <span className="text-red-400">*</span>
                            </label>
                            <Input
                              value={dispositivo.modelo}
                              onChange={(e) => actualizarDispositivo(index, "modelo", e.target.value)}
                              placeholder="Modelo del dispositivo"
                              required
                              disabled={isLoading}
                              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition-colors"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Número de Serie <span className="text-red-400">*</span>
                            </label>
                            <Input
                              value={dispositivo.numeroSerie}
                              onChange={(e) => actualizarDispositivo(index, "numeroSerie", e.target.value)}
                              placeholder="Número de serie único"
                              required
                              disabled={isLoading}
                              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition-colors"
                            />
                          </div> 
                        </div>
                      </div>
                    ))}
                    
                    <div className="pt-4 flex justify-between">

                      <Button 
                        type="button"
                        onClick={agregarDispositivo}
                        className="border-blue-500/30 text-blue-300 bg-gray-700 hover:bg-gray-600"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar otro dispositivo
                      </Button>
                       <br />
                      
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-700">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
                disabled={isLoading}
                className="border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 transition-colors min-w-[150px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : initialData ? (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Cambios
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Crear Cliente
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}